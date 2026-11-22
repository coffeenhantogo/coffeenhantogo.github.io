/* =========================================================
   Coffee Nhẫn To Go — site data (single source of truth)
   - Edit products / prices / articles here.
   - price: null  => shows "Liên hệ" (staff quotes when confirming the order).
     To show a price, set an integer in VND, e.g. price: 29000
     For sized items you may use prices per option: priceBy: { "M": 25000, "L": 30000 }
   ========================================================= */
window.NHAN = window.NHAN || {};

NHAN.STORE = {
  name: "Coffee Nhẫn To Go",
  slogan: "Drink to be happy",
  phone: "0909637168",
  phoneDisplay: "0909.637.168",
  zalo: "https://zalo.me/0909637168",
  email: "coffeenhantogo978@gmail.com",
  // Orders & contact messages are emailed through FormSubmit (https://formsubmit.co).
  // The FIRST submission sends an activation email to the address below — click "Activate" once.
  formEndpoint: "https://formsubmit.co/ajax/coffeenhantogo978@gmail.com",
  branches: [
    {
      id: "minh-phung",
      name: "Nhẫn – Minh Phụng",
      address: "351 Minh Phụng, P. Minh Phụng, TP.HCM",
      mapQuery: "351 Minh Phụng, Phường Minh Phụng, Hồ Chí Minh",
    },
    {
      id: "lac-long-quan",
      name: "Nhẫn – Lạc Long Quân",
      address: "26B/4 Lạc Long Quân, P. Bình Thới, TP.HCM",
      mapQuery: "26B/4 Lạc Long Quân, Phường Bình Thới, Hồ Chí Minh",
    },
  ],
};

/* Option presets ------------------------------------------------------- */
const DRINK_ICED_HOT = {
  size: ["M", "L"],
  temp: ["Đá", "Nóng"],
  sugar: ["Ít ngọt", "Vừa", "Ngọt"],
  ice: ["Ít đá", "Bình thường", "Nhiều đá"],
};
const DRINK_ICED = { size: ["M", "L"], sugar: ["Ít ngọt", "Vừa", "Ngọt"], ice: ["Ít đá", "Bình thường", "Nhiều đá"] };
const DRINK_HOT = { size: ["M", "L"], sugar: ["Không đường", "Ít ngọt", "Vừa"] };
const GROUND_OPTS = { weight: ["250g", "500g", "1kg"], grind: ["Xay pha phin", "Xay pha máy (espresso)", "Xay pour-over", "Xay French press"] };
const BEAN_OPTS = { weight: ["250g", "500g", "1kg"], grind: ["Nguyên hạt (không xay)", "Xay pha phin", "Xay pha máy (espresso)", "Xay pour-over"] };

NHAN.OPTION_LABELS = { size: "Size", temp: "Nóng / Đá", sugar: "Độ ngọt", ice: "Lượng đá", weight: "Trọng lượng", grind: "Độ xay" };

/* Products ------------------------------------------------------------- */
NHAN.PRODUCTS = [
  // ---- Đồ uống pha sẵn (type: drink) ----
  {
    id: "ca-phe-sua-da", type: "drink", group: "phin", cat: "Cà phê phin",
    name: "Cà phê sữa đá", img: "drink-sua-da", badge: "Bán chạy", price: null, featured: true,
    short: "Phin truyền thống pha với sữa đặc, đá viên mát lạnh.",
    desc: "Ly cà phê quen thuộc của người Sài Gòn: cà phê rang xay pha phin chậm rãi, hòa cùng sữa đặc béo ngọt và đá viên. Vị đậm, thơm, hậu ngọt – uống buổi sáng là tỉnh cả ngày.",
    notes: ["Đậm đà", "Béo ngọt", "Thơm phin"], options: DRINK_ICED_HOT,
  },
  {
    id: "bac-xiu", type: "drink", group: "dac-biet", cat: "Đặc biệt",
    name: "Bạc xỉu", img: "drink-bac-xiu", price: null, featured: true,
    short: "Nhiều sữa, ít cà phê – thơm béo, dịu nhẹ.",
    desc: "Bạc xỉu là phiên bản “nhiều sữa” của cà phê sữa: lớp sữa tươi và sữa đặc béo ngậy bên dưới, một chút cà phê phin thơm phía trên. Hợp với ai thích vị nhẹ nhàng, ít đắng.",
    notes: ["Nhiều sữa", "Dịu nhẹ", "Thơm béo"], options: DRINK_ICED,
  },
  {
    id: "ca-phe-muoi", type: "drink", group: "dac-biet", cat: "Đặc biệt",
    name: "Cà phê muối", img: "drink-muoi", badge: "Mới", price: null, featured: true,
    short: "Cà phê phin phủ lớp kem muối mằn mặn, béo mịn.",
    desc: "Lớp kem sữa đánh bông pha chút muối phủ lên cà phê phin đậm đà. Vị mặn nhẹ làm cà phê dậy hương và ngọt hậu hơn. Khuấy đều trước khi uống để cảm nhận trọn vị.",
    notes: ["Kem muối", "Đậm đà", "Hậu ngọt"], options: DRINK_ICED,
  },
  {
    id: "ca-phe-den-da", type: "drink", group: "phin", cat: "Cà phê phin",
    name: "Cà phê đen đá", img: "drink-den-da", price: null, featured: true,
    short: "Đen nguyên chất, đậm vị, uống là tỉnh.",
    desc: "Cà phê phin nguyên chất, không sữa – dành cho người mê vị đắng đậm và hương thơm rang. Có thể chọn độ ngọt theo ý thích.",
    notes: ["Đậm", "Đắng", "Thơm rang"], options: DRINK_ICED_HOT,
  },
  {
    id: "phin-den-nong", type: "drink", group: "phin", cat: "Cà phê phin",
    name: "Cà phê phin đen nóng", img: "drink-phin-nong", price: null, featured: true,
    short: "Phin nhỏ giọt tại chỗ, thưởng thức chậm rãi.",
    desc: "Phin được pha nóng, nhỏ giọt từng chút để giữ trọn hương thơm. Một ly cho những buổi sáng thong thả – đúng tinh thần “Nhẫn”.",
    notes: ["Thơm nồng", "Đậm", "Nguyên bản"], options: DRINK_HOT,
  },
  {
    id: "phin-sua-nong", type: "drink", group: "phin", cat: "Cà phê phin",
    name: "Cà phê sữa nóng", img: "latte-black", price: null,
    short: "Phin nóng hòa sữa đặc, ấm áp và béo thơm.",
    desc: "Cà phê phin nóng hòa cùng sữa đặc – ấm bụng, thơm béo, rất hợp những ngày mưa Sài Gòn.",
    notes: ["Ấm áp", "Béo ngọt"], options: { size: ["M", "L"], sugar: ["Ít ngọt", "Vừa", "Ngọt"] },
  },

  // ---- Cà phê rang xay (type: ground) ----
  {
    id: "rang-xay-pha-phin", type: "ground", group: "rang-xay", cat: "Rang xay",
    name: "Cà phê rang xay Pha Phin", img: "ground-phin-scoop", gallery: ["ground-phin-scoop", "ground-bowl-2", "drink-phin-nong"],
    badge: "Bán chạy", price: null, featured: true, roast: "Rang đậm", bean: "Blend",
    short: "Phối trộn dành riêng cho phin – đậm, thơm, sánh.",
    desc: "Công thức phối trộn dành cho phin nhôm truyền thống: nước cốt sánh, đậm vị, thơm mùi rang. Pha với sữa đặc hay uống đen đều ngon.",
    notes: ["Đậm", "Sô-cô-la đen", "Hậu ngọt"], options: GROUND_OPTS,
  },
  {
    id: "rang-xay-robusta", type: "ground", group: "rang-xay", cat: "Rang xay",
    name: "Cà phê rang xay Robusta", img: "ground-bowl-2", gallery: ["ground-bowl-2", "beans-roasted"],
    price: null, featured: true, roast: "Rang đậm", bean: "Robusta",
    short: "100% Robusta – mạnh mẽ, nhiều caffeine.",
    desc: "Robusta cho vị đắng mạnh, thân dày và hàm lượng caffeine cao. Lựa chọn của người thích cà phê “ra cà phê”, đặc biệt hợp pha phin và cà phê sữa đá.",
    notes: ["Đắng mạnh", "Thân dày", "Hạt dẻ"], options: GROUND_OPTS,
  },
  {
    id: "rang-xay-espresso", type: "ground", group: "rang-xay", cat: "Rang xay",
    name: "Cà phê rang xay Espresso Blend", img: "hero-beans", gallery: ["hero-beans", "hero-barista"],
    price: null, featured: true, roast: "Rang vừa – đậm", bean: "Blend",
    short: "Phối trộn cho máy pha – crema dày, cân bằng.",
    desc: "Phối trộn cân bằng giữa độ đậm và hương thơm, cho shot espresso có lớp crema đẹp. Dùng tốt cho latte, cappuccino và các món pha máy.",
    notes: ["Cân bằng", "Caramel", "Crema dày"], options: GROUND_OPTS,
  },
  {
    id: "rang-xay-arabica", type: "ground", group: "rang-xay", cat: "Rang xay",
    name: "Cà phê rang xay Arabica", img: "ground-bowl", gallery: ["ground-bowl", "beans-bowl"],
    price: null, featured: true, roast: "Rang vừa", bean: "Arabica",
    short: "Chua thanh, hương thơm phong phú.",
    desc: "Arabica có vị chua thanh dễ chịu, hương thơm phức hợp và ít đắng hơn Robusta. Hợp pha pour-over, French press hoặc phin cho người thích vị nhẹ.",
    notes: ["Chua thanh", "Hương hoa", "Ít đắng"], options: GROUND_OPTS,
  },
  {
    id: "rang-xay-signature", type: "ground", group: "rang-xay", cat: "Rang xay",
    name: "Cà phê rang xay Nhẫn Signature", img: "beans-sack-bags", gallery: ["beans-sack-bags", "hero-beans-hands"],
    badge: "Đặc biệt", price: null, featured: true, roast: "Rang vừa – đậm", bean: "Blend",
    short: "Công thức riêng của Nhẫn – chính là vị ly cà phê tại quán.",
    desc: "Công thức phối trộn riêng mà Nhẫn dùng để pha tại quán. Mang về nhà để có đúng hương vị ly cà phê Nhẫn mỗi sáng.",
    notes: ["Đậm đà", "Thơm rang", "Hậu ngọt"], options: GROUND_OPTS,
  },

  // ---- Cà phê hạt (type: bean) ----
  {
    id: "hat-robusta", type: "bean", group: "hat", cat: "Hạt nguyên",
    name: "Cà phê hạt Robusta rang mộc", img: "beans-roasted", gallery: ["beans-roasted", "beans-closeup"],
    price: null, roast: "Rang đậm", bean: "Robusta",
    short: "Hạt rang mộc, giữ trọn hương vị tự nhiên.",
    desc: "Hạt Robusta rang mộc, không tẩm ướp. Mua hạt nguyên và xay ngay trước khi pha để cà phê thơm nhất – hoặc chọn “xay giúp” khi đặt hàng.",
    notes: ["Đắng mạnh", "Thân dày"], options: BEAN_OPTS,
  },
  {
    id: "hat-arabica", type: "bean", group: "hat", cat: "Hạt nguyên",
    name: "Cà phê hạt Arabica rang vừa", img: "beans-bowl", gallery: ["beans-bowl", "ground-bowl"],
    price: null, roast: "Rang vừa", bean: "Arabica",
    short: "Chua thanh, thơm – hợp pha thủ công.",
    desc: "Arabica rang vừa để giữ vị chua thanh và hương thơm. Phù hợp các phương pháp pha thủ công như pour-over, French press, AeroPress.",
    notes: ["Chua thanh", "Hương trái cây"], options: BEAN_OPTS,
  },
  {
    id: "hat-culi", type: "bean", group: "hat", cat: "Hạt nguyên",
    name: "Cà phê hạt Culi", img: "beans-closeup", gallery: ["beans-closeup", "beans-roasted"],
    price: null, roast: "Rang đậm", bean: "Culi",
    short: "Hạt tròn đặc biệt, vị đậm và thơm nồng.",
    desc: "Culi là những hạt cà phê tròn (một nhân trong quả), được nhiều người ưa chuộng vì vị đậm và hương thơm nồng. Rất hợp pha phin.",
    notes: ["Đậm", "Thơm nồng"], options: BEAN_OPTS,
  },
  {
    id: "hat-espresso", type: "bean", group: "hat", cat: "Hạt nguyên",
    name: "Cà phê hạt Espresso Blend cho quán", img: "hero-beans-hands", gallery: ["hero-beans-hands", "hero-barista"],
    badge: "Cho quán", price: null, roast: "Rang vừa – đậm", bean: "Blend",
    short: "Dành cho quán cà phê dùng máy pha espresso.",
    desc: "Phối trộn ổn định cho máy pha espresso tại quán: chiết xuất đều, crema dày, dễ kết hợp với sữa. Liên hệ để được tư vấn số lượng lớn.",
    notes: ["Cân bằng", "Crema dày"], options: BEAN_OPTS,
  },
  {
    id: "hat-signature", type: "bean", group: "hat", cat: "Hạt nguyên",
    name: "Cà phê hạt Nhẫn Signature", img: "beans-sack-bags", gallery: ["beans-sack-bags", "coffee-cherries"],
    price: null, roast: "Rang vừa – đậm", bean: "Blend",
    short: "Công thức riêng của Nhẫn ở dạng hạt nguyên.",
    desc: "Công thức Signature của Nhẫn ở dạng hạt nguyên – giữ hương lâu hơn, xay theo đúng dụng cụ pha của bạn.",
    notes: ["Đậm đà", "Hậu ngọt"], options: BEAN_OPTS,
  },
];

/* Articles ------------------------------------------------------------- */
NHAN.ARTICLES = [
  {
    slug: "bi-quyet-pha-ca-phe-phin", tag: "Hướng dẫn", img: "drink-phin-nong", date: "2026-11-10", read: 5,
    title: "Bí quyết pha cà phê phin ngon đúng vị tại nhà",
    excerpt: "Chỉ với một chiếc phin nhôm, vài muỗng cà phê rang xay và một chút kiên nhẫn, bạn đã có ly cà phê đậm đà như ngoài quán.",
    body: [
      ["p", "Pha phin là cách pha cà phê đặc trưng của Việt Nam. Dụng cụ đơn giản, nhưng để có một ly ngon, bạn cần để ý vài chi tiết nhỏ."],
      ["h2", "1. Chuẩn bị"],
      ["ul", ["Phin nhôm hoặc inox (cỡ phổ biến cho 1 ly)", "Khoảng 20–25g cà phê rang xay pha phin (2–3 muỗng canh)", "Nước sôi khoảng 90–96°C (đun sôi rồi để nguội chừng 30 giây)", "Ly thủy tinh, sữa đặc nếu uống sữa"]],
      ["h2", "2. Tráng phin"],
      ["p", "Tráng phin và ly bằng nước sôi để làm nóng dụng cụ. Bước này giúp nhiệt độ ổn định, cà phê chiết xuất đều hơn."],
      ["h2", "3. Ủ cà phê"],
      ["p", "Cho cà phê vào phin, lắc nhẹ cho mặt bột phẳng. Đặt nắp gài lên, nén nhẹ. Rót khoảng 15–20ml nước sôi để “ủ” trong 20–30 giây – bột cà phê sẽ nở ra và tỏa hương."],
      ["h2", "4. Châm nước và chờ"],
      ["p", "Châm nước tới gần đầy phin, đậy nắp. Cà phê nhỏ giọt đều khoảng 4–5 phút là đạt. Nếu giọt chảy quá nhanh, lần sau nén chặt hơn; quá chậm thì nén nhẹ tay lại."],
      ["quote", "Đừng vội – sự kiên nhẫn chính là bí quyết của một ly phin ngon."],
      ["h2", "5. Thưởng thức"],
      ["p", "Khuấy cùng sữa đặc rồi thêm đá cho ly cà phê sữa đá, hoặc uống nóng nguyên chất. Cà phê rang xay Pha Phin của Nhẫn được phối trộn riêng cho cách pha này."],
    ],
    related: ["rang-xay-pha-phin", "rang-xay-signature"],
  },
  {
    slug: "robusta-va-arabica", tag: "Kiến thức", img: "plantation", date: "2026-11-05", read: 4,
    title: "Robusta và Arabica: chọn hạt nào hợp gu của bạn?",
    excerpt: "Robusta đậm, đắng và nhiều caffeine; Arabica chua thanh, hương thơm phức tạp. Cùng tìm hiểu để chọn đúng loại bạn thích.",
    body: [
      ["p", "Robusta và Arabica là hai giống cà phê phổ biến nhất thế giới. Mỗi loại có tính cách riêng, và không có loại nào “ngon hơn” – chỉ có loại hợp gu bạn hơn."],
      ["h2", "Robusta – mạnh mẽ, đậm đà"],
      ["ul", ["Vị đắng rõ, thân dày, ít chua", "Hàm lượng caffeine thường cao hơn Arabica", "Hợp pha phin, cà phê sữa đá, phối trộn espresso để tăng độ đậm và crema"]],
      ["h2", "Arabica – thanh, thơm, phức hợp"],
      ["ul", ["Vị chua thanh, hương thơm đa dạng (hoa, trái cây, caramel…)", "Ít đắng hơn, hậu vị nhẹ nhàng", "Hợp các cách pha thủ công: pour-over, French press, AeroPress"]],
      ["h2", "Vậy nên chọn loại nào?"],
      ["p", "Nếu bạn quen vị cà phê Việt đậm đà, uống với sữa – hãy chọn Robusta hoặc phối trộn thiên Robusta. Nếu thích vị nhẹ, thơm, uống đen – hãy thử Arabica. Còn phân vân? Một phối trộn cân bằng như Nhẫn Signature là điểm khởi đầu tốt."],
    ],
    related: ["rang-xay-robusta", "rang-xay-arabica"],
  },
  {
    slug: "cau-chuyen-ten-nhan", tag: "Câu chuyện", img: "coffee-cherries", date: "2026-10-28", read: 3,
    title: "Câu chuyện đằng sau cái tên “Nhẫn” và đóa sen",
    excerpt: "Giữa nhịp sống hối hả của Sài Gòn, chúng tôi chọn chữ “Nhẫn” như một lời nhắc: chậm lại một chút để tận hưởng.",
    body: [
      ["p", "“Nhẫn” trong tiếng Việt là kiên nhẫn – nhẫn nại. Đó cũng là điều một ly cà phê phin đòi hỏi: chờ từng giọt rơi, không vội vàng."],
      ["h2", "Vì sao là “Nhẫn”?"],
      ["p", "Sài Gòn luôn vội. Chúng tôi muốn mỗi ly cà phê mang đi vẫn giữ được sự chậm rãi ấy – pha cẩn thận, đậm đà, để người uống có vài phút thảnh thơi giữa ngày bận rộn."],
      ["h2", "Đóa sen trên logo"],
      ["p", "Hoa sen gợi sự thanh tịnh, an yên. Đặt cạnh nét thư pháp chữ “Nhẫn”, đóa sen là lời chúc bình an mà Nhẫn gửi tới mỗi khách hàng."],
      ["quote", "Drink to be happy – uống để vui, sống chậm để hạnh phúc."],
      ["p", "Hẹn gặp bạn tại 351 Minh Phụng và 26B/4 Lạc Long Quân."],
    ],
    related: ["ca-phe-sua-da", "rang-xay-signature"],
  },
  {
    slug: "chon-do-xay-phu-hop", tag: "Hướng dẫn", img: "ground-bowl", date: "2026-10-20", read: 4,
    title: "Chọn độ xay cà phê phù hợp với từng cách pha",
    excerpt: "Xay quá mịn hay quá thô đều làm ly cà phê kém ngon. Đây là cách chọn độ xay đúng cho phin, máy pha, pour-over và French press.",
    body: [
      ["p", "Độ xay quyết định tốc độ nước đi qua bột cà phê – từ đó ảnh hưởng trực tiếp tới vị. Xay quá mịn dễ bị đắng gắt, quá thô thì nhạt và chua."],
      ["h2", "Bảng độ xay tham khảo"],
      ["ul", ["Pha máy (espresso): rất mịn, gần như bột", "Pha phin: mịn vừa – hạt nhỏ như đường cát mịn", "Pour-over (V60…): trung bình, như cát biển", "French press: thô, như muối hạt"]],
      ["h2", "Mẹo nhỏ"],
      ["p", "Cà phê xay xong mất hương khá nhanh. Nếu có máy xay ở nhà, hãy mua hạt nguyên và xay ngay trước khi pha. Nếu không, khi đặt hàng tại Nhẫn bạn có thể chọn độ xay theo dụng cụ của mình."],
    ],
    related: ["hat-arabica", "rang-xay-espresso"],
  },
  {
    slug: "bao-quan-ca-phe", tag: "Kiến thức", img: "beans-sack-bags", date: "2026-10-12", read: 3,
    title: "Cách bảo quản cà phê hạt và rang xay luôn thơm",
    excerpt: "Không khí, độ ẩm, ánh sáng và nhiệt độ là “kẻ thù” của cà phê. Vài thói quen nhỏ giúp cà phê giữ hương lâu hơn.",
    body: [
      ["p", "Sau khi rang, cà phê bắt đầu mất dần hương thơm. Bảo quản đúng cách giúp bạn tận hưởng trọn vị tới muỗng cuối cùng."],
      ["h2", "4 nguyên tắc"],
      ["ul", ["Đựng trong hũ/túi kín, có van một chiều càng tốt", "Để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp", "Không để gần bếp hoặc nơi có mùi mạnh", "Hạn chế mở túi nhiều lần – chia nhỏ nếu mua số lượng lớn"]],
      ["h2", "Có nên để tủ lạnh?"],
      ["p", "Không nên để cà phê dùng hằng ngày trong ngăn mát: mỗi lần lấy ra, hơi nước dễ ngưng tụ làm cà phê ẩm và hút mùi. Tốt nhất hãy mua lượng vừa đủ dùng trong vài tuần."],
    ],
    related: ["hat-robusta", "hat-signature"],
  },
  {
    slug: "ca-phe-muoi-la-gi", tag: "Đồ uống", img: "drink-muoi", date: "2026-10-03", read: 3,
    title: "Cà phê muối là gì mà ai cũng mê?",
    excerpt: "Một chút muối trong lớp kem béo làm cà phê đậm đà và ngọt hậu hơn. Cùng tìm hiểu món đồ uống đang được yêu thích này.",
    body: [
      ["p", "Cà phê muối gồm cà phê phin đậm đà và lớp kem sữa đánh bông có pha chút muối phủ lên trên."],
      ["h2", "Vì sao lại thêm muối?"],
      ["p", "Một lượng muối nhỏ giúp cân bằng vị đắng, làm vị ngọt và béo của kem nổi bật hơn. Kết quả là ly cà phê tròn vị, hậu ngọt dễ chịu."],
      ["h2", "Uống thế nào cho ngon?"],
      ["p", "Có hai cách: nhấp từng ngụm để cảm nhận lớp kem rồi tới cà phê, hoặc khuấy đều để hòa quyện. Thử cả hai để tìm cách bạn thích nhất!"],
    ],
    related: ["ca-phe-muoi", "bac-xiu"],
  },
];
