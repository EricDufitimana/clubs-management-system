import { NextResponse } from "next/server";

const headerData = [
    { label: 'Home', href: '/#home' },
    { label: 'About', href: '/#about' },
    { label: 'Features', href: '/#features' },
    { label: 'Reviews', href: '/#reviews' },
    { label: 'FAQ', href: '/#faq' },
    {label: 'Contact', href: '/contact'}
];

const footerData = {
    brand: {
        name: "Clubs Management System",
        tagline: "Connecting communities through exceptional club management.",
        socialLinks: []
    },
    sitemap: {
        name: "Quick Links",
        links: [
            { name: "Home", url: "/" },
            { name: "Contact", url: "/contact" },
            { name: "Sign In", url: "/signin" },
            { name: "Dashboard", url: "/dashboard" }
        ]
    },
    contactDetails: {
        name:"Get in Touch",
        address: "",
        email: "",
        phone: "+250794007353"
    },
    copyright: "©2025 Clubs Management System. All Rights Reserved"
};

export const GET = async () => {
  return NextResponse.json({
    headerData,
    footerData
  });
};