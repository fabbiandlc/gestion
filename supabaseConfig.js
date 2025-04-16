// supabaseConfig.js
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://laptztfdcryylfjorfpl.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcHR6dGZkY3J5eWxmam9yZnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3Mjk0NjgsImV4cCI6MjA2MDMwNTQ2OH0.iGLmd7M91bv9ZVJD44rxkiOSG1gdGYgd5uXsBo60upg";

export const supabase = createClient(supabaseUrl, supabaseKey);