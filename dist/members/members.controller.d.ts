export declare class MembersController {
    getAll(): Promise<{
        id: string;
        gymId: string;
        name: string;
        phone: string;
        email: string | null;
        qatarId: string | null;
        status: string;
        joinDate: Date;
    }[]>;
    create(body: any): Promise<{
        id: string;
        gymId: string;
        name: string;
        phone: string;
        email: string | null;
        qatarId: string | null;
        status: string;
        joinDate: Date;
    }>;
}
