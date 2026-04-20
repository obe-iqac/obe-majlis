import mongoose from "mongoose";

const SuperAdminSchema = new mongoose.Schema({
  password: {
    type: String,
    required: [true, "name is required"],
  },
});

const SuperAdmin =
  mongoose.models.SuperAdmin || mongoose.model("SuperAdmins", SuperAdminSchema);

export default SuperAdmin;
