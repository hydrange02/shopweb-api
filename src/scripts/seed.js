db.products.updateMany(
  {}, // Áp dụng cho toàn bộ sản phẩm trong collection
  [
    {
      $set: {
        // Ép kiểu rating thành Double và mặc định là 0.0
        rating: { $toDouble: 0.0 },
        
        // Ép kiểu reviewCount thành Int32 và mặc định là 0
        // (Bạn dùng 0 hoặc NumberInt(0) đều được trong Pipeline này)
        reviewCount: { $convert: { input: 0, to: "int" } }
      }
    }
  ]
);