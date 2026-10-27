import { AlertCircle } from "lucide-react"
import type { Staff } from "../lib/auth"
import { usePackagesScreen } from "../hooks/usePackagesScreen"
import { CategoryManagerModal } from "./packages/PackageCategoryModal"
import { PackageCategorySection } from "./packages/PackageCategorySection"
import { PackageFormModal } from "./packages/PackageFormModal"
import { PackageGrid } from "./packages/PackageTable"
import { DeletePackageModal } from "./packages/DeletePackageModal"
import { PackageCategoryFilter } from "./packages/PackageCategoryFilter"
import { PackageScreenHeader } from "./packages/PackageScreenHeader"
import { Toast } from "./ui/Toast"

interface PackagesScreenProps {
  currentStaff?: Staff | null
}

export function PackagesScreen({ currentStaff }: PackagesScreenProps) {
  const isAdmin = currentStaff ? currentStaff.role === "admin" : true
  const state = usePackagesScreen()

  return (
    <div className="space-y-6">
      {state.toast && (
        <Toast
          message={state.toast.message}
          type={state.toast.type}
          onClose={() => state.setToast(null)}
        />
      )}

      {/* Header */}
      <PackageScreenHeader
        isAdmin={isAdmin}
        onOpenCategoryManager={() => state.setIsCategoryManagerOpen(true)}
        onOpenCreate={state.handleOpenCreate}
      />

      {/* Admin Section: Package Category Management */}
      {isAdmin && (
        <PackageCategorySection
          categories={state.categories}
          packages={state.packages}
          onCategoryAdded={state.handleCategoryCreated}
          onCategoryUpdated={state.handleCategoryUpdated}
          onCategoryDeleted={state.handleCategoryDeleted}
        />
      )}

      {/* Category Filter Tabs & Sort Controls */}
      <PackageCategoryFilter
        categories={state.categories}
        packages={state.packages}
        selectedCategory={state.selectedCategoryFilter}
        onSelectCategory={state.setSelectedCategoryFilter}
        sortBy={state.sortBy}
        onSortByChange={state.setSortBy}
      />

      {/* Error Banner */}
      {state.error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-base font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Packages Grid */}
      <PackageGrid
        loading={state.loading}
        packages={state.packages}
        filteredPackages={state.filteredPackages}
        readOnly={!isAdmin}
        onOpenCreate={state.handleOpenCreate}
        onOpenEdit={state.handleOpenEdit}
        onDeleteRequest={(pkg) => state.setDeletingPackage(pkg)}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={state.isCategoryManagerOpen}
        categories={state.categories}
        packages={state.packages}
        onClose={() => state.setIsCategoryManagerOpen(false)}
        onCategoryAdded={state.handleCategoryCreated}
        onCategoryUpdated={state.handleCategoryUpdated}
        onCategoryDeleted={state.handleCategoryDeleted}
      />

      {/* Create / Edit Form Modal */}
      <PackageFormModal
        isOpen={state.isModalOpen}
        editingPackage={state.editingPackage}
        categories={state.categories}
        onClose={() => state.setIsModalOpen(false)}
        onSuccess={state.handleFormSuccess}
        onCategoryCreated={state.handleCategoryCreated}
      />

      {/* Delete Confirmation Modal */}
      <DeletePackageModal
        packageItem={state.deletingPackage}
        loading={state.deleteLoading}
        onClose={() => state.setDeletingPackage(null)}
        onConfirm={state.handleDeleteConfirm}
      />
    </div>
  )
}
