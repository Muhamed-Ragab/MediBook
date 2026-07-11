import { useState, useRef, useEffect } from "react";
import {
  useSpecialties,
  useCreateSpecialty,
  useUpdateSpecialty,
  useDeleteSpecialty,
} from "../api/adminApi";
import type { Specialty, SpecialtyFormData, ModalMode } from "../types";

export function useAdminSpecialties() {
  const { data: specialties, isLoading, isError } = useSpecialties();
  const createSpecialty = useCreateSpecialty();
  const updateSpecialty = useUpdateSpecialty();
  const deleteSpecialty = useDeleteSpecialty();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Specialty | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState("");

  const addModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (modalMode === "add") {
      setFormName("");
      setFormDescription("");
      setFormError("");
      addModalRef.current?.showModal();
    } else if (modalMode === "edit" && editingSpecialty) {
      setFormName(editingSpecialty.name);
      setFormDescription(editingSpecialty.description ?? "");
      setFormError("");
      editModalRef.current?.showModal();
    }
  }, [modalMode, editingSpecialty]);

  const handleAdd = () => {
    if (!formName.trim()) {
      setFormError("Name is required");
      return;
    }
    const data: SpecialtyFormData = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
    };
    createSpecialty.mutate(data, {
      onSuccess: () => {
        addModalRef.current?.close();
        setModalMode(null);
      },
      onError: (err) => setFormError(err.message),
    });
  };

  const handleEdit = () => {
    if (!formName.trim() || !editingSpecialty) {
      setFormError("Name is required");
      return;
    }
    const data: SpecialtyFormData = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
    };
    updateSpecialty.mutate(
      { id: editingSpecialty.id, data },
      {
        onSuccess: () => {
          editModalRef.current?.close();
          setModalMode(null);
          setEditingSpecialty(null);
        },
        onError: (err) => setFormError(err.message),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSpecialty.mutate(deleteTarget.id, {
      onSuccess: () => {
        deleteModalRef.current?.close();
        setDeleteTarget(null);
      },
    });
  };

  const openEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setModalMode("edit");
  };

  const openDelete = (specialty: Specialty) => {
    setDeleteTarget(specialty);
    deleteModalRef.current?.showModal();
  };

  return {
    specialties,
    isLoading,
    isError,
    modalMode,
    editingSpecialty,
    deleteTarget,
    formName,
    formDescription,
    formError,
    addModalRef,
    editModalRef,
    deleteModalRef,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    setFormName,
    setFormDescription,
    setModalMode,
    setEditingSpecialty,
    setDeleteTarget,
    handleAdd,
    handleEdit,
    handleDelete,
    openEdit,
    openDelete,
  };
}
