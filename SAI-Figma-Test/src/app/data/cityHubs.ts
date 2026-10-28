export interface CityHub {
  name: string;
  state: string;
  tag: string;
  img: string;
  listingsCount: string;
  avgPrice: string;
  growth?: string;
  popularAreas?: string[];
}

export const CITY_HUBS: CityHub[] = [
  {
    name: "Pune",
    state: "Maharashtra",
    tag: "IT & Cultural Capital",
    img: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=800&h=600&fit=crop&auto=format",
    listingsCount: "1,850+ Listings",
    avgPrice: "₹7,600/sq.ft",
    growth: "+14.2% YoY",
    popularAreas: ["Baner", "Wakad", "Kharadi", "Koregaon Park"]
  },
  {
    name: "Amravati",
    state: "Maharashtra",
    tag: "Heritage & Green Oasis",
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format",
    listingsCount: "380+ Listings",
    avgPrice: "₹3,400/sq.ft",
    growth: "+9.1% YoY",
    popularAreas: ["Rajapeth", "Camp", "Badnera Road", "Sai Nagar"]
  },
  {
    name: "Nagpur",
    state: "Maharashtra",
    tag: "Orange City & MIHAN Hub",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&auto=format",
    listingsCount: "940+ Listings",
    avgPrice: "₹4,800/sq.ft",
    growth: "+11.5% YoY",
    popularAreas: ["Dharampeth", "Manish Nagar", "Civil Lines", "Wardha Road"]
  },
  {
    name: "Mumbai",
    state: "Maharashtra",
    tag: "Financial Capital & Skyline",
    img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=600&fit=crop&auto=format",
    listingsCount: "4,200+ Listings",
    avgPrice: "₹22,500/sq.ft",
    growth: "+8.7% YoY",
    popularAreas: ["Andheri", "Bandra", "Powai", "Worli"]
  },
  {
    name: "Nashik",
    state: "Maharashtra",
    tag: "Wine Capital & Green Living",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=600&fit=crop&auto=format",
    listingsCount: "620+ Listings",
    avgPrice: "₹4,200/sq.ft",
    growth: "+10.3% YoY",
    popularAreas: ["Gangapur Road", "Indira Nagar", "College Road", "Govind Nagar"]
  },
  {
    name: "Jaipur",
    state: "Rajasthan",
    tag: "Royal Pink City & Palaces",
    img: "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?w=800&h=600&fit=crop&auto=format",
    listingsCount: "1,150+ Listings",
    avgPrice: "₹4,900/sq.ft",
    growth: "+13.1% YoY",
    popularAreas: ["Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Jagatpura"]
  },
  {
    name: "Bangalore",
    state: "Karnataka",
    tag: "Silicon Valley of India",
    img: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&h=600&fit=crop&auto=format",
    listingsCount: "3,890+ Listings",
    avgPrice: "₹8,900/sq.ft",
    growth: "+15.8% YoY",
    popularAreas: ["Whitefield", "Indiranagar", "Koramangala", "HSR Layout"]
  },
  {
    name: "Hyderabad",
    state: "Telangana",
    tag: "City of Pearls & Cyberabad",
    img: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&h=600&fit=crop&auto=format",
    listingsCount: "2,980+ Listings",
    avgPrice: "₹7,100/sq.ft",
    growth: "+16.4% YoY",
    popularAreas: ["Gachibowli", "Hitec City", "Madhapur", "Jubilee Hills"]
  },
  {
    name: "Chennai",
    state: "Tamil Nadu",
    tag: "Coastal Megacity & Tech Hub",
    img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&h=600&fit=crop&auto=format",
    listingsCount: "2,150+ Listings",
    avgPrice: "₹6,800/sq.ft",
    growth: "+9.8% YoY",
    popularAreas: ["OMR", "Adyar", "Anna Nagar", "Velachery"]
  },
  {
    name: "Delhi NCR",
    state: "Delhi NCR",
    tag: "National Capital Hub",
    img: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop&auto=format",
    listingsCount: "4,600+ Listings",
    avgPrice: "₹9,800/sq.ft",
    growth: "+11.2% YoY",
    popularAreas: ["Connaught Place", "Dwarka", "South Extension", "Vasant Kunj"]
  },
  {
    name: "Ahmedabad",
    state: "Gujarat",
    tag: "Heritage & Riverfront City",
    img: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=600&fit=crop&auto=format",
    listingsCount: "1,640+ Listings",
    avgPrice: "₹5,400/sq.ft",
    growth: "+12.0% YoY",
    popularAreas: ["SG Highway", "Bodakdev", "Prahlad Nagar", "Satellite"]
  },
  {
    name: "Kolkata",
    state: "West Bengal",
    tag: "City of Joy & Heritage",
    img: "https://images.unsplash.com/photo-1558431382-27e303142255?w=800&h=600&fit=crop&auto=format",
    listingsCount: "1,780+ Listings",
    avgPrice: "₹5,200/sq.ft",
    growth: "+8.4% YoY",
    popularAreas: ["New Town", "Salt Lake", "Ballygunge", "Alipore"]
  },
  {
    name: "Surat",
    state: "Gujarat",
    tag: "Diamond & Textile Capital",
    img: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=600&fit=crop&auto=format",
    listingsCount: "820+ Listings",
    avgPrice: "₹4,600/sq.ft",
    growth: "+13.7% YoY",
    popularAreas: ["Vesu", "Adajan", "Pal", "Piplod"]
  },
  {
    name: "Indore",
    state: "Madhya Pradesh",
    tag: "Cleanest Smart City",
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=600&fit=crop&auto=format",
    listingsCount: "760+ Listings",
    avgPrice: "₹4,300/sq.ft",
    growth: "+14.0% YoY",
    popularAreas: ["Vijay Nagar", "Super Corridor", "Palasia", "Bhawarkua"]
  },
  {
    name: "Bhopal",
    state: "Madhya Pradesh",
    tag: "City of Lakes & Serenity",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&auto=format",
    listingsCount: "510+ Listings",
    avgPrice: "₹3,600/sq.ft",
    growth: "+8.9% YoY",
    popularAreas: ["Arera Colony", "Hoshangabad Road", "Kolar Road", "MP Nagar"]
  },
  {
    name: "Noida",
    state: "Uttar Pradesh",
    tag: "Expressway & High-Rise Towers",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&auto=format",
    listingsCount: "2,420+ Listings",
    avgPrice: "₹7,400/sq.ft",
    growth: "+15.3% YoY",
    popularAreas: ["Sector 150", "Sector 62", "Sector 137", "Noida Expressway"]
  },
  {
    name: "Gurgaon",
    state: "Haryana",
    tag: "Millennium Cyber City",
    img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&h=600&fit=crop&auto=format",
    listingsCount: "3,120+ Listings",
    avgPrice: "₹11,500/sq.ft",
    growth: "+17.1% YoY",
    popularAreas: ["Golf Course Road", "Cyber City", "Sohna Road", "Sector 57"]
  }
];

export const CITY_HUBS_MAP = new Map<string, CityHub>(
  CITY_HUBS.map(c => [c.name.toLowerCase(), c])
);
