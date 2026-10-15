import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        dto: any;
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        user: {
            name: string;
        };
    }>;
}
