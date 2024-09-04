"use client";

import ProfileComponent from "./ProfileComponent";
import PaymentsPage from "./PaymentsPage";
import AuthDataDisplay from "./AuthDataDisplay";

export default function Profile() {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto gap-4">
      <div className="text-3xl font-bold">User Profile</div>
      <AuthDataDisplay />
      <ProfileComponent />
      <PaymentsPage />
    </div>
  );
}
