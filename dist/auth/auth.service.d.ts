export declare class AuthService {
    register(dto: any): Promise<{
        message: string;
        dto: any;
    }>;
    login(dto: any): Promise<{
        token: string;
        user: {
            name: string;
        };
    }>;
}
