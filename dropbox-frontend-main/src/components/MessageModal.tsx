import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageResponse } from "@/api/message";
import { Eye, Download } from "lucide-react";
import apiClient from "@/api/axios";

interface MessageModalProps {
  message: MessageResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({ message, isOpen, onClose }) => {
  if (!message) return null;

  const isImage = (fileUrl: string) => /\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(fileUrl);
  const isZip = (fileUrl: string) => /\.(zip|rar|7z)$/i.test(fileUrl);
  const isPDF = (fileUrl: string) => /\.pdf$/i.test(fileUrl);

  const handleDownload = async (messageId: string, fileName: string) => {
    try {
      console.log("Downloading file for Message ID:", messageId);

      const response = await apiClient.get(`/messages/download/${messageId}`, {
        responseType: "blob",
      });

      let fileNameToUse = fileName || "downloaded-file";
      const contentDisposition = response.headers["content-disposition"];

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileNameToUse = match[1];
        }
      }

      const fileExtension = fileNameToUse.split(".").pop()?.toLowerCase();
      let mimeType = response.headers["content-type"] || "application/octet-stream";

      if (fileExtension === "pdf") {
        mimeType = "application/pdf";
      } else if (["zip", "rar", "7z"].includes(fileExtension || "")) {
        mimeType = "application/zip";
      }

      console.log(`Detected file type: ${mimeType}`);

      const blob = new Blob([response.data], { type: mimeType });
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileNameToUse;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      console.log("Download successful:", fileNameToUse);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[70%] overflow-y-auto rounded-lg shadow-lg bg-white">
        <DialogHeader>
          <DialogTitle className="text-[26px] font-semibold text-black">{message.title}</DialogTitle>
          <DialogDescription className="text-gray-900 font-bold">
            Type: <span className="text-gray-700 font-medium">{message.type}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 text-gray-700">{message.description}</div>

        {message.filePath && message.filePath.length > 0 && (
          <div className="p-4 border-t">
            <h3 className="text-lg text-black font-semibold mb-2">Attached Files:</h3>
            <div className="grid gap-3">
              {message.filePath.map((filePath, index) => {
                const fileName = filePath.split("/").pop() || `file-${index}`;

                return (
                  <div key={index} className="flex items-center gap-2 border rounded-md p-2 bg-gray-100">
                    {isImage(filePath) ? (
                      <div className="flex items-center gap-2">
                        <img src={filePath} alt={`Attachment ${index + 1}`} className="w-16 h-16 rounded-md object-cover" />
                        <a href={filePath} target="_blank" rel="noopener noreferrer">
                          <Button variant="link" className="text-blue-600 flex items-center">
                            <Eye className="w-4 h-4 mr-1" /> View Image
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <Button
                        variant="link"
                        className="flex items-center text-blue-600"
                        onClick={() => handleDownload(message._id, fileName)}
                      >
                        <Download className="w-4 h-4 mr-1" /> Download {isZip(filePath) ? "ZIP" : isPDF(filePath) ? "PDF" : "File"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} className="w-full bg-gray-800 text-white hover:bg-gray-700">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageModal;