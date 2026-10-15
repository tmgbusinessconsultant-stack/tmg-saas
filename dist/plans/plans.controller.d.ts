export declare class PlansController {
    findAll(): Promise<{
        id: string;
        gymId: string;
        name: string;
        type: string;
        price: number;
        duration: number;
        sessions: number | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    create(body: any): Promise<{
        id: string;
        gymId: string;
        name: string;
        type: string;
        price: number;
        duration: number;
        sessions: number | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    delete(id: string): Promise<{
        id: string;
        gymId: string;
        name: string;
        type: string;
        price: number;
        duration: number;
        sessions: number | null;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
    }>;
}
