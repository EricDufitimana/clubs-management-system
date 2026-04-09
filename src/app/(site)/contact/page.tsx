
import ContactForm from "@/components/contact-form";
import Faq from "@/components/home/faq";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: "Contact | CMS",
};

export default function Page() {
    return (
        <main>
            <ContactForm/>
            <Faq/>
        </main>
    );
};
