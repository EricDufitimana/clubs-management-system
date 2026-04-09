import SignUp from "@/components/auth/sign-up";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | CMS",
};

const SignupPage = () => {
  return (
    <>
      <SignUp />
    </>
  );
};

export default SignupPage;
