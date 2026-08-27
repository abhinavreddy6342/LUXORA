const products = [
  {
    id: 1,
    name: "Aero Chronograph",
    category: "Timepieces",
    price: 18999,
    originalPrice: 21999,
    discount: 14,
    rating: 4.8,
    reviews: 124,
    badge: "BESTSELLER",
    image:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=90",
    ],
    description:
      "A refined chronograph designed with precision, clarity and timeless proportions.",
    featured: true,
    reviewItems: [
      {
        id: "r1-1",
        name: "Arjun Mehta",
        rating: 5,
        title: "Impeccable finish & dial clarity",
        comment: "The sapphire glass clarity and leather strap quality exceed expectations. Feels like a timepiece twice its price.",
        date: "2026-08-14",
        verified: true,
      },
      {
        id: "r1-2",
        name: "Devika Sharma",
        rating: 5,
        title: "Understated luxury at its best",
        comment: "Elegant minimalist design. The chrono buttons operate with a satisfying tactical click.",
        date: "2026-08-02",
        verified: true,
      },
      {
        id: "r1-3",
        name: "Rohan V.",
        rating: 4,
        title: "Great everyday chronograph",
        comment: "Very comfortable strap. Keeps precise time and looks stunning under daylight.",
        date: "2026-07-21",
        verified: true,
      },
    ],
  },
  {
    id: 2,
    name: "Essential Leather",
    category: "Accessories",
    price: 8499,
    originalPrice: 9999,
    discount: 15,
    rating: 4.9,
    reviews: 86,
    badge: "NEW",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=90",
    ],
    description:
      "Premium leather craftsmanship with a clean silhouette built for everyday use.",
    featured: true,
    reviewItems: [
      {
        id: "r2-1",
        name: "Kavya Nair",
        rating: 5,
        title: "Rich leather scent & texture",
        comment: "The full-grain leather ages gracefully. Perfect stitch precision and comfortable shoulder feel.",
        date: "2026-08-18",
        verified: true,
      },
      {
        id: "r2-2",
        name: "Siddharth Rao",
        rating: 5,
        title: "Ideal minimalist wallet/cardholder",
        comment: "Fits essential cards effortlessly without bulging. Truly premium finish.",
        date: "2026-07-29",
        verified: true,
      },
    ],
  },
  {
    id: 3,
    name: "Studio Runner",
    category: "Footwear",
    price: 12999,
    rating: 4.7,
    reviews: 213,
    badge: "BESTSELLER",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
    ],
    description:
      "Lightweight everyday footwear combining comfort, performance and minimal design.",
    featured: true,
    reviewItems: [
      {
        id: "r3-1",
        name: "Ananya Iyer",
        rating: 5,
        title: "All-day comfort with sleek look",
        comment: "Walked 15,000 steps around Tokyo in these. Outstanding cushioning and true to size.",
        date: "2026-08-11",
        verified: true,
      },
      {
        id: "r3-2",
        name: "Kabir Sengupta",
        rating: 4,
        title: "Versatile styling",
        comment: "Pairs perfectly with relaxed trousers or shorts. Breathable upper and sturdy grip.",
        date: "2026-07-15",
        verified: true,
      },
    ],
  },
  {
    id: 4,
    name: "Minimal Carry",
    category: "Travel",
    price: 10999,
    originalPrice: 12999,
    discount: 15,
    rating: 4.8,
    reviews: 97,
    badge: "LIMITED",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=90",
    ],
    description:
      "A structured travel companion designed for modern movement and effortless organization.",
    featured: true,
    reviewItems: [
      {
        id: "r4-1",
        name: "Vikramaditya C.",
        rating: 5,
        title: "Ideal carry-on capacity",
        comment: "Fits a 16-inch laptop, tech pouch, and overnight clothes effortlessly. Weatherproof zippers are top notch.",
        date: "2026-08-09",
        verified: true,
      },
      {
        id: "r4-2",
        name: "Meera Patel",
        rating: 5,
        title: "Thoughtful internal compartments",
        comment: "No more digging around for keys or passport. Extremely sturdy build.",
        date: "2026-07-28",
        verified: true,
      },
    ],
  },
  {
    id: 5,
    name: "Mono Classic",
    category: "Timepieces",
    price: 15999,
    rating: 4.6,
    reviews: 71,
    badge: "FEATURED",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=90",
    ],
    description:
      "A minimal timepiece with a balanced dial and understated character.",
    featured: false,
    reviewItems: [
      {
        id: "r5-1",
        name: "Tanya Kapoor",
        rating: 5,
        title: "Subtle elegance",
        comment: "The slim profile slides smoothly under shirt cuffs. Highly recommend for formal settings.",
        date: "2026-08-01",
        verified: true,
      },
    ],
  },
  {
    id: 6,
    name: "Executive Tote",
    category: "Accessories",
    price: 11999,
    originalPrice: 13999,
    discount: 14,
    rating: 4.9,
    reviews: 142,
    badge: "BESTSELLER",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=90",
    ],
    description:
      "A spacious premium tote crafted for workdays, travel and everything between.",
    featured: false,
    reviewItems: [
      {
        id: "r6-1",
        name: "Pooja Malhotra",
        rating: 5,
        title: "My everyday work bag!",
        comment: "Holds my MacBook, charger, water bottle, and notebook with structured elegance.",
        date: "2026-08-16",
        verified: true,
      },
    ],
  },
  {
    id: 7,
    name: "Urban Runner",
    category: "Footwear",
    price: 9499,
    rating: 4.7,
    reviews: 188,
    badge: "NEW",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
    ],
    description:
      "A versatile everyday sneaker with a clean urban profile.",
    featured: false,
    reviewItems: [
      {
        id: "r7-1",
        name: "Aditya Verma",
        rating: 5,
        title: "Super light & stylish",
        comment: "Clean lines and great arch support. Gets compliments everywhere I go.",
        date: "2026-08-05",
        verified: true,
      },
    ],
  },
  {
    id: 8,
    name: "Weekender",
    category: "Travel",
    price: 13999,
    rating: 4.8,
    reviews: 104,
    badge: "LIMITED",
    image:
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=90",
    images: [
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=90",
    ],
    description:
      "A spacious weekender designed for short trips and effortless travel.",
    featured: false,
    reviewItems: [
      {
        id: "r8-1",
        name: "Neel K.",
        rating: 5,
        title: "Perfect weekend getaway duffel",
        comment: "High quality canvas and solid brass hardware. Fits 3-4 days worth of gear easily.",
        date: "2026-08-20",
        verified: true,
      },
    ],
  },
];

export const categories = [
  "All",
  "Timepieces",
  "Accessories",
  "Footwear",
  "Travel",
];

export default products;