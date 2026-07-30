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
    <div className="flex flex-col relative w-full h-full">
      {verificationMessage && (
        <div
          className={`flex items-center p-4 mb-4 absolute -top-16 left-1/2 transform -translate-x-1/2 text-sm rounded-lg w-full max-w-[90%] shadow-lg ${
            verificationMessage.type === "success"
              ? "bg-green-500/20 text-green-200 border border-green-500/50 backdrop-blur-md"
              : verificationMessage.type === "error"
                ? "bg-red-500/20 text-red-200 border border-red-500/50 backdrop-blur-md"
                : "bg-yellow-500/20 text-yellow-200 border border-yellow-500/50 backdrop-blur-md"
          }`}
          role="alert"
        >
          {verificationMessage.type === "success" && (
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          )}
          {verificationMessage.type === "error" && (
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          )}
          {verificationMessage.type === "already-verified" && (
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          )}
          <span className="font-medium text-center w-full">{verificationMessage.message}</span>
        </div>
      )}
      <LoginForm />
    </div>
  );
};

export default LoginPage;
