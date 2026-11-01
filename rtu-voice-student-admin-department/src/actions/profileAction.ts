"use server";

import { str } from "@/features/shared/sharedUtils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UpdateProfileType } from "@/features/shared/sharedTypes";

export async function UpdateProfile(formData: FormData): Promise<UpdateProfileType>{
    const newFirstName = str(formData.get("firstName")).trim();
    const newLastName = str(formData.get("lastName")).trim();

    if (!newFirstName) return {success: false, message:"Invalid input", errors:{firstName: "Please enter your first name"}};
    if (!newLastName) return {success: false, message:"Invalid input", errors:{firstName: "Please enter your last name"}};

    const supabase = await createClient();

    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return {success: false, message: "Not logged in."};

    const {error} = await supabase.auth.updateUser({data: {
        first_name: newFirstName,
        last_name: newLastName
    }});
    if (error) return { success: false, message: "Couln't update your name."};

    const admin = await createAdminClient();

    const {error: tableError} = await admin.from("users").update({first_name: newFirstName, last_name: newLastName}).eq("id", user.id);
    if(tableError) return {success: false, message:"Error in updating your name"};
    console.log("Sucessfully updated your name.")
    return {success: true, message: ""};
}