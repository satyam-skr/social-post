import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const postSchema = new Schema({
    text: {
        type: String,
        min: 10,
        trim: true
    },
    image: {
        type: String, // url
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Post"
    }],
    isComment: {
        type: Boolean,
        default: false
    },
    parentComment: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        default: null
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
})

postSchema.plugin(aggregatePaginate);

export const Post = mongoose.model("Post", postSchema);