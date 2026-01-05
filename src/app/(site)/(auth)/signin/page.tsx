import Signin from "@/components/auth/sign-in";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | CMS",
};

const SigninPage = () => {
  return (
    <>
      <Signin />
    </>
  );
};

export default SigninPage;
