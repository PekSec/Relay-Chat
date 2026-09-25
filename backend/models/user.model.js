import mongoose from "mongoose";

export const preferenceFields = {
    theme: { type: String, enum: ["system", "light", "dark"], default: "system" },
    accent: { type: String, enum: ["blue", "lime", "red", "orange", "yellow", "green", "teal", "purple", "magenta", "gray", "relay-bosphorus", "relay-iris", "relay-pine", "relay-copper"], default: "blue" },
    density: { type: String, enum: ["comfortable", "compact"], default: "comfortable" },
    fontSize: { type: String, enum: ["standard", "large"], default: "standard" },
    sendKey: { type: String, enum: ["enter", "mod-enter"], default: "enter" },
    chatSound: { type: Boolean, default: true },
    notificationSound: { type: Boolean, default: true },
    messagePreviews: { type: Boolean, default: true }
};

const userSchema = new mongoose.Schema({
    preferences: preferenceFields,
    fullName:{
        type: String,
        required:true,
        },
    username:{
        type: String,
        required:true,
        unique:true,
    },
    password:{
        type: String,
        required:true,
    },
    gender:{
        type: String,
        required:true,
        enum:["male", "female"]
    },
    profilePic:{
        type: String,
        default:"",
    },
    friendCode:{
        type: String,
        required:true,
        unique:true,
        minlength:4,
        maxlength:4,
    },
    friends:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:[],
    }],
}, {timestamps:true});

const User = mongoose.model("User", userSchema);
export default User;
