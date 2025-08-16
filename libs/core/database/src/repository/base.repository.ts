import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  DeleteResult,
  UpdateResult,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';

export class BaseRepository<T extends BaseEntity> extends Repository<T> {
  async findByIdOrFail(id: string): Promise<T> {
    const entity = await this.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
    
    if (!entity) {
      throw new Error(`Entity with id ${id} not found`);
    }
    
    return entity;
  }

  override async findOneByOrFail(where: FindOptionsWhere<T>): Promise<T> {
    const entity = await this.findOneBy(where);
    
    if (!entity) {
      throw new Error('Entity not found');
    }
    
    return entity;
  }

  async createAndSave(entityData: DeepPartial<T>): Promise<T> {
    const entity = this.create(entityData);
    return this.save(entity);
  }

  async updateById(id: string, updateData: DeepPartial<T>): Promise<T> {
    const entity = await this.findByIdOrFail(id);
    Object.assign(entity, updateData);
    return this.save(entity);
  }

  async softDeleteById(id: string): Promise<UpdateResult> {
    return this.softDelete(id);
  }

  async restoreById(id: string): Promise<UpdateResult> {
    return this.restore(id);
  }

  async findWithDeleted(options?: FindManyOptions<T>): Promise<T[]> {
    return this.find({
      ...options,
      withDeleted: true,
    });
  }

  async findOneWithDeleted(options: FindOneOptions<T>): Promise<T | null> {
    return this.findOne({
      ...options,
      withDeleted: true,
    });
  }

  async bulkCreate(entitiesData: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.create(entitiesData);
    return this.save(entities);
  }

  async existsByWhere(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.count({ where });
    return count > 0;
  }
}