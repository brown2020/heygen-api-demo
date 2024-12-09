"use client";

import ProfileComponent from "./ProfileComponent";
import PaymentsPage from "./PaymentsPage";
import AuthDataDisplay from "./AuthDataDisplay";
import ProfileCreditComponent from "./ProfileCreditComponent";

export default function Profile() {
  return (
    <div className="h-full font-sans mx-auto w-full p-5 flex flex-col sm:flex-row gap-5 justify-between max-sm:mt-5">
      <div className="w-full">
        <AuthDataDisplay />
        <ProfileCreditComponent />
      </div>
      <div className="w-full">
        <ProfileComponent />
        <PaymentsPage />
      </div>
    </div>
  );
}
