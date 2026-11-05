"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/guards";

export type PendingComplaint = {
    id: string
    created_at: string
    tracking_id: string
    title: string
    category: string
    is_returned: boolean
    returned_at: string | null
    returned_by_department_id: number | null
    returned_by_department: string | null
    return_reason: string | null
}

export type PendingComplaintState = {
    success: boolean
    message: string
    pending_complaints?: PendingComplaint[]
}

export async function getPendingComplaints(): Promise<PendingComplaintState>{
    const me = await getCurrentUser();
    if (!me || me.role !== 'admin') return {success: false, message: "Not allowed."};

    const supabase = await createClient();

    const {data, error} = await supabase.rpc("get_pending_validation_queue", {}, {count: "exact"});

    if (error) {
        console.error("[getPendingComplaints] rpc failed:", error);
        return { success: false, message: "Couldn't load pending complaints. Please try again." };
    }
    if (!data) {
        return { success: false, message: "No complaint submitted yet." };
    }

    return {success: true, message: "", pending_complaints: [data as PendingComplaint]};
}

export async function getMasterTrackingQueue(){
    const me = await getCurrentUser();
    if (!me || me.role !== 'admin') return {success: false, message: "Not allowed."};

    const supabase = await createClient();
    const {data, error} = await supabase.rpc("get_pending_validation_queue", {}, {count: "exact"});

    if (error) {
        console.error("[getMasterTrackingQueue] rpc failed:", error);
        return { success: false, message: "Couldn't load pending complaints. Please try again." };
    }
    if (!data) {
        return { success: false, message: "No complaint submitted yet." };
    }

    return {success: true, message: "", pending_complaints: [data as PendingComplaint]};
}
