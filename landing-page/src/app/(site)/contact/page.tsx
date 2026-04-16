
import ContactForm from "../../components/contact-form/index";
import Faq from "../../components/home/faq/index";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: "Contact | Awake Agency",
};

export default function Page() {
    return (
        <main>
            <ContactForm/>
            <Faq/>
        </main>
    );
};
