declare class AuthService {
    register(email: string, password: string, name: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, refreshToken: string): Promise<void>;
    private generateTokens;
    private storeRefreshToken;
    handleOAuthCallback(user: any): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            avatar: any;
        };
        accessToken: string;
        refreshToken: string;
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map