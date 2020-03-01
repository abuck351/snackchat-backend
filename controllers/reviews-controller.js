const { Review, validateReview } = require("../models/review");
const { Business } = require("../models/business");
const { User } = require("../models/user");

getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("tags")
      .populate("author", "name");
    if (reviews.length === 0)
      return res.status(404).send({ err: "No Reviews found" });
    return res.status(200).send({ reviews });
  } catch (err) {
    return res.status(500).send({ err });
  }
};

getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("tags")
      .populate("author", "name");
    if (!review) return res.status(404).send({ err: "Review not found" });
    return res.status(200).send({ review });
  } catch (err) {
    return res.status(500).send({ err });
  }
};

createReview = async (req, res) => {
  const { error } = validateReview(req.body);
  if (error) return res.status(400).send({ err: error.details[0].message });

  const review = new Review({
    title: req.body.title,
    description: req.body.description,
    starRating: req.body.starRating,
    reviewImage: req.file.path,
    tags: req.body.tags,
    author: req.userData.userId,
    business_id: req.body.business_id
  });

  try {
    await review.save();

    await Business.findByIdAndUpdate(req.body.business_id, { $addToSet: { reviews: review._id, tags: review.tags }, $inc: {'review_count': 1} })

    return res.status(201).send({
      review,
      message: "Review successfully created!"
    });
  } catch (err) {
    return res.status(500).send({ err });
  }
};

likeReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate({ _id: req.params.id }, { $inc: { 'likeCount': 1 }, $addToSet: { 'likes': req.userData.userId } }).exec()

    await User.findByIdAndUpdate(req.userData.userId, { $addToSet: {likedReviews: review._id}})

    return res.status(200).send({
      message: "Successfully liked review!"
    });
  } catch (err) {
    console.log(err)
    return res.status(500).send({ err });
  }
}

unlikeReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate({ _id: req.params.id }, { $inc: { 'likeCount': -1 }, $pull: { likes: req.userData.userId }}).exec()

    await User.findByIdAndUpdate(req.userData.userId, { $pull: { likedReviews: review._id } })

    return res.status(200).send({
      message: "Successfully unliked review!"
    });
  } catch (err) {
    console.log(err)
    return res.status(500).send({ err });
  }
}

updateReview = async (req, res) => {
  const { error } = validateReview(req.body);
  if (error) return res.status(400).send({ err: error.details[0].message });

  try {
    const review = await Review.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      starRating: req.body.starRating,
      reviewImage: req.file.path
    });

    if (!review) return res.status(404).send({ err: "Review not found" });

    return res.status(200).send({
      review,
      message: "Review successfully updated!"
    });
  } catch (err) {
    res.status(500).send({ err });
  }
};

deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndRemove(req.params.id);

    if (!review) return res.status(404).send({ err: "Review not found" });

    return res.status(200).send({
      review,
      message: "Review successfully deleted!"
    });
  } catch (err) {
    res.status(500).send({ err });
  }
};

module.exports = {
  getReviews,
  getReviewById,
  likeReview,
  unlikeReview,
  createReview,
  updateReview,
  deleteReview
};