export declare class GymsService {
    findAll(): any[];
    findOne(id: string): any;
    findBySlug(slug: string): any;
    create(dto: any): any;
    update(id: string, dto: any): any;
    remove(id: string): {
        deleted: boolean;
    };
}
