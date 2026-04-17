import { useState, useCallback } from "react";
import { Upload, Download, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

export default function CSVUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const csvFile = acceptedFiles[0];
    if (!csvFile) return;

    // Validate file size (10MB limit)
    if (csvFile.size > 10 * 1024 * 1024) {
      setErrors([{ message: "File size exceeds 10MB limit" }]);
      return;
    }

    setFile(csvFile);
    setErrors([]);
    setUploadResult(null);

    // Parse CSV for preview
    Papa.parse(csvFile, {
      header: true,
      preview: 10,
      complete: (results) => {
        setPreview(results.data);
      },
      error: (error) => {
        setErrors([{ message: `CSV parsing error: ${error.message}` }]);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/imports/bulk-csv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadResult(result);

      if (result.error_count === 0) {
        // Success - close modal after 2 seconds
        setTimeout(() => {
          onUploadSuccess?.();
          handleClose();
        }, 2000);
      } else {
        setErrors(result.errors || []);
      }
    } catch (error) {
      setErrors([{ message: error.message || "Upload failed" }]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const token = localStorage.getItem("access_token");
    fetch("/api/imports/csv-template", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "uk-cbam-import-template.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setUploadResult(null);
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Bulk Import CSV</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a CSV file to import multiple CBAM records at once
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Need a template?
                </p>
                <p className="text-xs text-muted-foreground">
                  Download our CSV template with the correct format
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          {/* File Upload Dropzone */}
          {!file && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border hover:border-emerald-500/50 hover:bg-muted/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-sm font-medium text-foreground">
                {isDragActive
                  ? "Drop your CSV file here"
                  : "Drag & drop a CSV file here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Maximum file size: 10MB | Maximum rows: 1000
              </p>
            </div>
          )}

          {/* File Preview */}
          {file && preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-foreground">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setUploadResult(null);
                    setErrors([]);
                  }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>

              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {preview[0] &&
                          Object.keys(preview[0]).map((key) => (
                            <th
                              key={key}
                              className="text-left p-2 font-medium text-muted-foreground"
                            >
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          {Object.values(row).map((val, i) => (
                            <td key={i} className="p-2 text-foreground/80">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-2 bg-muted/30 text-center text-xs text-muted-foreground">
                  Showing first 10 rows
                </div>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div
              className={`p-4 rounded-xl border ${
                uploadResult.error_count === 0
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {uploadResult.error_count === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {uploadResult.error_count === 0
                      ? "Upload Successful!"
                      : "Upload Completed with Errors"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadResult.success_count} records imported successfully
                    {uploadResult.error_count > 0 &&
                      `, ${uploadResult.error_count} failed`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-400">
                Errors ({errors.length})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs"
                  >
                    {err.row && (
                      <span className="font-mono text-red-400">
                        Row {err.row}:
                      </span>
                    )}{" "}
                    {err.field && (
                      <span className="font-medium text-foreground">
                        {err.field} -
                      </span>
                    )}{" "}
                    <span className="text-muted-foreground">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading || uploadResult?.error_count === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
