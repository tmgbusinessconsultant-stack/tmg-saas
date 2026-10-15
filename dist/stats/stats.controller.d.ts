export declare class StatsController {
    get(): Promise<{
        members: number;
        active: number;
        plans: number;
        revenue: any;
        currency: string;
    }>;
}
