export type RegisterState = {
    success: boolean;
    message: string;
    errors?: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
    };
};

export type ChangePasswordType = {
    success: boolean,
    message: string,
    errors?: {
        oldPassword?: string,
        newPassword?: string,
        confirmPassword?: string
    }

}

export type resendState = { success: boolean; message: string };
export type LoginState = { success: boolean; message: string };

export type PendingRegistration = {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
};

export const PURPOSE = { registration: 1, password_reset: 2 } as const;

export type verifyState = { success: boolean; message: string };

export type Purpose = keyof typeof PURPOSE;

export interface ButtonStepProps{
    nextStep: () => void;
}


