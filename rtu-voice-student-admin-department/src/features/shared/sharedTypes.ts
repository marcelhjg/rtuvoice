export type UpdateProfileType = {
    success: boolean,
    message: string,
    errors?: {
        firstName?: string,
        lastName?: string
    }
}