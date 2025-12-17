require("dotenv").config();
const { connectMongo } = require("../db/mongoose");
const { Product } = require("../models/product.model");

async function run() {
  await connectMongo();
  const count = await Product.countDocuments();
  if (count > 0) {
    console.log(`DB had ${count} products — skip seeding.`);
    process.exit(0);
  }

  const docs = Array.from({ length: 30 }, (_, i) => {
    const id = String(i + 1).padStart(2, "0");
    const slug = `san-pham-${id}`;
    const cat = (i + 1) % 2 === 0 ? "fashion" : "electronics";
    const brand = (i + 1) % 3 === 0 ? "Acme" : "Contoso";
    return {
      title: `Sản phẩm ${id}`,
      slug,
      price: 50000 + (i + 1) * 10000,
      images: ["/placeholder.png"],
      stock: 5 + ((i + 1) % 7),
      rating: 4.2,
      brand,
      variants: [{ color: (i + 1) % 2 ? "black" : "white", size: (i + 1) % 3 ? "M" : "L" }],
      description: `Mô tả ngắn cho sản phẩm ${id}.`,
      category: cat,
    };
  });

  await Product.insertMany(docs);
  console.log("Seeded products:", docs.length);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});