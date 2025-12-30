const { Schema, model, Types } = require("mongoose");

const ReviewSchema = new Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    product: { type: Types.ObjectId, ref: "Product", required: true },
    user: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ReviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  try {
    await this.model("Product").findByIdAndUpdate(productId, {
      numReviews: stats[0]?.nRating || 0,
      rating: stats[0]?.avgRating || 0,
    });
  } catch (err) {
    console.error(err);
  }
};

ReviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.product);
});

ReviewSchema.post("remove", function () {
  this.constructor.calcAverageRatings(this.product);
});

const Review = model("Review", ReviewSchema);
module.exports = { Review };
