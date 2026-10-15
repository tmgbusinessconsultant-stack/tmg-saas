export declare class SubscriptionsController {
    getAll(): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        memberId: string;
        planId: string;
        startDate: Date;
        endDate: Date;
        paymentStatus: string;
        paymentMethod: string;
        amountPaid: number;
        remainingSessions: number | null;
    }[]>;
    create(body: any): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        memberId: string;
        planId: string;
        startDate: Date;
        endDate: Date;
        paymentStatus: string;
        paymentMethod: string;
        amountPaid: number;
        remainingSessions: number | null;
    }>;
}
