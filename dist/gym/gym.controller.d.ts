export declare class GymController {
    get(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        phone: string | null;
        email: string | null;
        address: string | null;
        currency: string;
        updatedAt: Date;
    }>;
    update(body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        phone: string | null;
        email: string | null;
        address: string | null;
        currency: string;
        updatedAt: Date;
    }>;
}
