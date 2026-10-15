import { GymsService } from './gyms.service';
export declare class GymsController {
    private gyms;
    constructor(gyms: GymsService);
    findAll(): any[];
    findOne(id: string): any;
    create(body: any): any;
    update(id: string, body: any): any;
    remove(id: string): {
        deleted: boolean;
    };
}
