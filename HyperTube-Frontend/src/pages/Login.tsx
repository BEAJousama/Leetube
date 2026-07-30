import LoginForm from "@/containers/LoginForm";
import { useAuthStore } from "@/stores/AuthStore";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useEffect } from "react";

const LoginPage = () => {
  const { verificationMessage, clearVerificationMessage } = useAuthStore();

  useEffect(() => {
    if (verificationMessage) {
      const timer = setTimeout(() => {
        clearVerificationMessage();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [verificationMessage, clearVerificationMessage]);

  return (
    <div className=" flex flex-col bg-primary-900">
      {verificationMessage && (
        <div
          className={`flex items-center p-4 mb-4 absolute top-0 left-1/2 transform -translate-x-1/2 text-sm rounded-lg ${
            verificationMessage.type === "success"
              ? "bg-green-100 text-green-700"
              : verificationMessage.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
          }`}
          role="alert"
        >
          {verificationMessage.type === "success" && (
            <CheckCircle className="w-5 h-5 mr-2" />
          )}
          {verificationMessage.type === "error" && (
            <XCircle className="w-5 h-5 mr-2" />
          )}
          {verificationMessage.type === "already-verified" && (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          <span className="font-medium">{verificationMessage.message}</span>
        </div>
      )}
      <LoginForm />
    </div>
  );
};

export default LoginPage;
