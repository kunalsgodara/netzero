import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ArrowUpDown, X, Download, Package, Tag } from "lucide-react";
import Select from "@/components/ui/Select";
import { cbamApi } from "@/services/cbamApiService";

const SECTORS = ["steel", "aluminium", "cement", "fertiliser", "hydrogen"];

export default function UKCBAMProducts() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [sortBy, setSortBy] = useState("commodity_code");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch all products
  const { data: products, isLoading } = useQuery({
    queryKey: ["cbam-products"],
    queryFn: () => cbamApi.getProducts(),
    staleTime: 10 * 60 * 1000,
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    // Apply search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.commodity_code.includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sector.toLowerCase().includes(q)
      );
    }

    // Apply sector filter
    if (sectorFilter) {
      filtered = filtered.filter((p) => p.sector === sectorFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle numeric sorting for default_intensity
      if (sortBy === "default_intensity") {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [products, searchTerm, sectorFilter, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleExportCSV = () => {
    if (!filteredProducts.length) return;

    const headers = [
      "CN Code",
      "Description",
      "Sector",
      "Product Type",
      "Default Intensity (tCO₂e/t)",
      "Includes Indirect",
      "Valid From",
      "Valid To",
    ];

    const rows = filteredProducts.map((p) => [
      p.commodity_code,
      p.description,
      p.sector,
      p.product_type,
      p.default_intensity,
      p.includes_indirect ? "Yes" : "No",
      p.valid_from,
      p.valid_to || "—",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uk-cbam-products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            UK CBAM Products Reference
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse all products subject to UK Carbon Border Adjustment Mechanism
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!filteredProducts.length}
          className="flex items-center gap-2 px-4 py-2.5 bg-background hover:bg-muted border border-border text-foreground rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card shadow-sm border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            Total Products
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {products?.length || 0}
          </p>
        </div>
        <div className="bg-card shadow-sm border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            Filtered Results
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {filteredProducts.length}
          </p>
        </div>
        <div className="bg-card shadow-sm border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            Sectors
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {SECTORS.length}
          </p>
        </div>
        <div className="bg-card shadow-sm border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            With Indirect Emissions
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {products?.filter((p) => p.includes_indirect).length || 0}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Search by CN code, product name, or sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground/70" />
          <Select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            style={{ width: "auto" }}
          >
            <option value="">All Sectors</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-border border-t-emerald-400 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground/70 mt-3">
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground mt-4">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                  <th
                    className="text-left p-3 pl-4 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("commodity_code")}
                  >
                    <div className="flex items-center gap-1">
                      CN Code
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="text-left p-3 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("description")}
                  >
                    <div className="flex items-center gap-1">
                      Product Name
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="text-left p-3 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("sector")}
                  >
                    <div className="flex items-center gap-1">
                      Sector
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="text-right p-3 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("default_intensity")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Default Intensity
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="text-center p-3">Includes Indirect</th>
                  <th className="text-left p-3">Valid From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 pl-4 font-mono text-foreground/80">
                      {product.commodity_code}
                    </td>
                    <td className="p-3 text-foreground/70 max-w-md">
                      {product.description}
                    </td>
                    <td className="p-3 text-muted-foreground capitalize">
                      {product.sector}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">
                      {product.default_intensity} tCO₂e/t
                    </td>
                    <td className="p-3 text-center">
                      {product.includes_indirect ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-muted" />
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(product.valid_from).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-foreground">Product Details</h2>
                <p className="text-sm font-mono text-muted-foreground mt-0.5">{selectedProduct.commodity_code}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Description + Sector badge */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</p>
                  <p className="text-sm text-foreground mt-1">{selectedProduct.description}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Classification</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                      <Tag className="w-3 h-3" />
                      {selectedProduct.sector}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground capitalize">
                      {selectedProduct.product_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Emission Intensity */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Default Emission Intensity</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {selectedProduct.default_intensity} <span className="text-lg font-medium">tCO₂e/t</span>
                </p>
              </div>

              {/* Indirect + Valid From */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Includes Indirect Emissions</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${selectedProduct.includes_indirect ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    <p className="text-sm text-foreground">{selectedProduct.includes_indirect ? "Yes" : "No"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valid From</p>
                  <p className="text-sm text-foreground mt-1">
                    {new Date(selectedProduct.valid_from).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedProduct.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</p>
                  <p className="text-sm text-foreground mt-1">{selectedProduct.notes}</p>
                </div>
              )}

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">8-digit CN code format</p>
                <p>All UK CBAM products use the 8-digit Combined Nomenclature (CN) code format as specified by HMRC regulations.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
