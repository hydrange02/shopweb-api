// src/scripts/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const slugify = require("slugify");
const bcrypt = require("bcryptjs");

// 1. Import Database Connection
const { connectMongo: connectDB } = require("../db/mongoose");

// 2. Import Models
const { User } = require("../models/user.model");
const { Product } = require("../models/product.model");
const { Order } = require("../models/order.model");
const { Cart } = require("../models/cart.model");

// --- DANH SÁCH ẢNH UNSPLASH CHẤT LƯỢNG CAO (STABLE) ---
// Nam
const imgMenTshirt = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80";
const imgMenShirt = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80";
const imgMenJacket = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80";
const imgMenJeans = "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=600&q=80";
const imgMenSuit = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80";

// Nữ
const imgWomenDress = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80";
const imgWomenTop = "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=600&q=80";
const imgWomenJeans = "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80";
const imgWomenSkirt = "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80";
const imgWomenCoat = "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80";

// Phụ kiện & Giày
const imgBag = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80";
const imgShoesSneaker = "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80";
const imgShoesHeels = "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80";
const imgWatch = "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80";
const imgGlasses = "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80";


const productsData = [
  // === NAM (15 Món) ===
  { title: "Áo Thun Nam Basic White", price: 150000, images: [imgMenTshirt], category: "Áo nam", description: "Áo thun trắng basic, chất liệu cotton thoáng mát.", stock: 100 },
  { title: "Sơ Mi Nam Oxford Blue", price: 300000, images: [imgMenShirt], category: "Áo nam", description: "Sơ mi xanh lịch lãm cho dân công sở.", stock: 50 },
  { title: "Áo Khoác Denim Jacket", price: 450000, images: [imgMenJacket], category: "Áo nam", description: "Áo khoác bò bụi bặm, phong cách street style.", stock: 40 },
  { title: "Quần Jean Slim Fit", price: 380000, images: [imgMenJeans], category: "Quần nam", description: "Quần jean xanh đậm, form ôm vừa vặn.", stock: 60 },
  { title: "Bộ Vest Nam Cao Cấp", price: 1500000, images: [imgMenSuit], category: "Áo nam", description: "Vest sang trọng cho các sự kiện quan trọng.", stock: 10 },
  
  // Tạo thêm các biến thể để đủ số lượng
  { title: "Áo Thun Nam Đen Premium", price: 160000, images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80"], category: "Áo nam", description: "Màu đen huyền bí, dễ phối đồ.", stock: 80 },
  { title: "Áo Khoác Bomber Xanh Rêu", price: 550000, images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80"], category: "Áo nam", description: "Bomber sành điệu, ấm áp.", stock: 25 },
  { title: "Quần Kaki Nam Be", price: 320000, images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80"], category: "Quần nam", description: "Kaki ống đứng, lịch sự.", stock: 45 },
  { title: "Áo Hoodie Xám Muối Tiêu", price: 280000, images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80"], category: "Áo nam", description: "Hoodie nỉ bông dày dặn.", stock: 35 },
  { title: "Áo Polo Sọc Ngang", price: 220000, images: ["https://images.unsplash.com/photo-1625910515337-1751250e1a77?auto=format&fit=crop&w=600&q=80"], category: "Áo nam", description: "Polo trẻ trung năng động.", stock: 55 },
  { title: "Quần Short Thể Thao", price: 120000, images: ["https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=600&q=80"], category: "Quần nam", description: "Thoải mái vận động.", stock: 90 },
  { title: "Áo Len Cổ Lọ", price: 350000, images: ["https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&w=600&q=80"], category: "Áo nam", description: "Giữ ấm cổ cực tốt.", stock: 20 },
  { title: "Quần Jogger Túi Hộp", price: 290000, images: ["https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=600&q=80"], category: "Quần nam", description: "Phong cách Cargo hầm hố.", stock: 30 },
  { title: "Sơ Mi Caro Flannel", price: 260000, images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80"], category: "Áo nam", description: "Họa tiết caro không bao giờ lỗi mốt.", stock: 40 },
  { title: "Áo Ba Lỗ Tập Gym", price: 90000, images: [imgMenTshirt], category: "Áo nam", description: "Thoáng mát, khoe cơ bắp.", stock: 100 },

  // === NỮ (20 Món) ===
  { title: "Váy Hoa Nhí Vintage", price: 250000, images: [imgWomenDress], category: "Váy nữ", description: "Váy hoa nhẹ nhàng, nữ tính.", stock: 50 },
  { title: "Áo Croptop Trắng", price: 120000, images: [imgWomenTop], category: "Áo nữ", description: "Khoe eo thon, dễ phối đồ.", stock: 60 },
  { title: "Quần Jean Ống Rộng", price: 350000, images: [imgWomenJeans], category: "Quần nữ", description: "Hack dáng chân dài miên man.", stock: 40 },
  { title: "Chân Váy Xếp Ly", price: 190000, images: [imgWomenSkirt], category: "Váy nữ", description: "Năng động, trẻ trung.", stock: 55 },
  { title: "Áo Khoác Dạ Mùa Đông", price: 850000, images: [imgWomenCoat], category: "Áo nữ", description: "Sang trọng, ấm áp.", stock: 15 },

  // Biến thể nữ
  { title: "Đầm Dự Tiệc Đỏ", price: 650000, images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"], category: "Váy nữ", description: "Nổi bật, quyến rũ.", stock: 20 },
  { title: "Áo Sơ Mi Lụa Công Sở", price: 280000, images: ["https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=600&q=80"], category: "Áo nữ", description: "Mềm mại, thanh lịch.", stock: 35 },
  { title: "Quần Short Jean", price: 180000, images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80"], category: "Quần nữ", description: "Cá tính, mát mẻ.", stock: 70 },
  { title: "Áo Blazer Hàn Quốc", price: 420000, images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80"], category: "Áo nữ", description: "Khoác ngoài cực chất.", stock: 25 },
  { title: "Váy Maxi Đi Biển", price: 320000, images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80"], category: "Váy nữ", description: "Thướt tha trong gió.", stock: 30 },
  { title: "Áo Len Cardigan", price: 210000, images: ["https://images.unsplash.com/photo-1624835659325-0a8a8167732a?auto=format&fit=crop&w=600&q=80"], category: "Áo nữ", description: "Nhẹ nhàng, nữ tính.", stock: 45 },
  { title: "Quần Legging Tập Yoga", price: 150000, images: ["https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?auto=format&fit=crop&w=600&q=80"], category: "Quần nữ", description: "Co giãn 4 chiều.", stock: 80 },
  { title: "Áo 2 Dây Mùa Hè", price: 95000, images: [imgWomenTop], category: "Áo nữ", description: "Mát mẻ ngày hè.", stock: 90 },
  { title: "Chân Váy Bút Chì", price: 240000, images: [imgWomenSkirt], category: "Váy nữ", description: "Chuẩn form công sở.", stock: 30 },
  { title: "Set Đồ Ngủ Pijama", price: 180000, images: ["https://images.unsplash.com/photo-1621786030484-4c855eed6974?auto=format&fit=crop&w=600&q=80"], category: "Đồ mặc nhà", description: "Lụa satin mềm mịn.", stock: 50 },

  // === PHỤ KIỆN (15 Món) ===
  { title: "Túi Xách Da Thời Trang", price: 550000, images: [imgBag], category: "Túi xách", description: "Da thật, bền đẹp.", stock: 30 },
  { title: "Giày Sneaker Trắng", price: 600000, images: [imgShoesSneaker], category: "Giày dép", description: "Đế êm, dễ phối đồ.", stock: 40 },
  { title: "Giày Cao Gót Mũi Nhọn", price: 450000, images: [imgShoesHeels], category: "Giày dép", description: "Tôn dáng phái đẹp.", stock: 25 },
  { title: "Đồng Hồ Thời Trang", price: 1200000, images: [imgWatch], category: "Đồng hồ", description: "Thiết kế tinh xảo.", stock: 15 },
  { title: "Kính Mát Chống UV", price: 250000, images: [imgGlasses], category: "Kính mắt", description: "Bảo vệ mắt tối đa.", stock: 60 },

  // Biến thể phụ kiện
  { title: "Balo Laptop Chống Sốc", price: 380000, images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80"], category: "Balo", description: "Đựng vừa laptop 15 inch.", stock: 45 },
  { title: "Ví Da Nam Cầm Tay", price: 290000, images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80"], category: "Ví", description: "Nhiều ngăn tiện lợi.", stock: 50 },
  { title: "Mũ Lưỡi Trai Đen", price: 120000, images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80"], category: "Mũ nón", description: "Phong cách đường phố.", stock: 70 },
  { title: "Túi Tote Vải Canvas", price: 80000, images: ["https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=600&q=80"], category: "Túi xách", description: "Bảo vệ môi trường.", stock: 100 },
  { title: "Giày Boot Da Cổ Cao", price: 750000, images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80"], category: "Giày dép", description: "Cá tính, ngầu.", stock: 20 },
  { title: "Dây Chuyền Bạc", price: 350000, images: ["https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&w=600&q=80"], category: "Trang sức", description: "Sáng bóng, tinh tế.", stock: 40 },
  { title: "Khuyên Tai Ngọc Trai", price: 150000, images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"], category: "Trang sức", description: "Điểm nhấn nhẹ nhàng.", stock: 55 },
  { title: "Thắt Lưng Da Bò", price: 220000, images: ["https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80"], category: "Phụ kiện", description: "Da thật 100%.", stock: 35 },
  { title: "Khăn Choàng Cổ Len", price: 160000, images: ["https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=600&q=80"], category: "Phụ kiện", description: "Ấm áp mùa đông.", stock: 60 },
  { title: "Vớ (Tất) Cổ Cao", price: 50000, images: ["https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=600&q=80"], category: "Phụ kiện", description: "Cotton thấm hút.", stock: 120 }
];

async function seed() {
  try {
    console.log("⏳ Đang kết nối MongoDB...");
    await connectDB();
    console.log("✔ Kết nối thành công!");

    // 1. Xóa dữ liệu cũ
    console.log("⏳ Đang xóa dữ liệu cũ...");
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Cart.deleteMany({})
    ]);
    console.log("✔ Đã dọn sạch Database!");

    // 2. Tạo Users
    console.log("⏳ Đang tạo người dùng mẫu...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    await User.create([
      {
        name: "Quản trị viên",
        email: "admin@gmail.com",
        passwordHash: hashedPassword,
        phone: "0909000111",
        address: "HCM, Vietnam",
        role: "admin",
        isVerified: true,
      },
      {
        name: "Khách hàng Demo",
        email: "client@gmail.com",
        passwordHash: hashedPassword,
        phone: "0909000222",
        address: "Hà Nội, Vietnam",
        role: "user",
        isVerified: true,
      },
    ]);
    console.log("✔ Đã tạo 2 User: admin & client (Pass: 123456)");

    // 3. Tạo 50 Sản phẩm
    console.log(`⏳ Đang tạo ${productsData.length} sản phẩm từ Unsplash...`);
    
    const finalProducts = productsData.map(p => ({
      ...p,
      slug: slugify(p.title, { lower: true, strict: true }) + "-" + Math.floor(Math.random() * 10000),
      discountPercent: Math.random() > 0.7 ? 10 : 0,
      sizes: ["S", "M", "L", "XL"],
      isFeatured: Math.random() > 0.8,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      brand: "Shoply Fashion"
    }));

    await Product.insertMany(finalProducts);
    console.log(`✔ Đã thêm thành công ${finalProducts.length} sản phẩm!`);

    console.log("🎉 SEED DATA THÀNH CÔNG! 🎉");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi khi seed data:", err);
    process.exit(1);
  }
}

seed();