import SignUp from "../../../components/auth/sign-up/index";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Sign Up | Awake Agency",
};

const SignupPage = () => {
  return (
    <>
      <SignUp />
    </>
  );
};

export default SignupPage;
