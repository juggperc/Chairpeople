import * as React from 'react';
import { useCompanyStore } from '@/stores/company';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Employee, Department } from '@/types';

interface CompanyEditorProps {
  onClose: () => void;
}

export function CompanyEditor({ onClose }: CompanyEditorProps) {
  const { activeCompanyId, companies, updateCompany, addDepartment, removeDepartment, addEmployee, updateEmployee, removeEmployee } = useCompanyStore();
  const company = companies.find((c) => c.id === activeCompanyId);

  const [name, setName] = React.useState(company?.name || '');
  const [description, setDescription] = React.useState(company?.description || '');
  const [editingDept, setEditingDept] = React.useState<Department | null>(null);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [showAddDept, setShowAddDept] = React.useState(false);
  const [showAddEmployee, setShowAddEmployee] = React.useState(false);

  const [newDeptName, setNewDeptName] = React.useState('');
  const [newDeptDesc, setNewDeptDesc] = React.useState('');

  const [newEmpName, setNewEmpName] = React.useState('');
  const [newEmpRole, setNewEmpRole] = React.useState('');
  const [newEmpDept, setNewEmpDept] = React.useState('');
  const [newEmpPersonality, setNewEmpPersonality] = React.useState('');
  const [newEmpSpecialties, setNewEmpSpecialties] = React.useState('');
  const [newEmpReportingTo, setNewEmpReportingTo] = React.useState('');

  if (!company || !activeCompanyId) {
    return null;
  }

  const handleSave = () => {
    updateCompany(activeCompanyId, { name, description });
    onClose();
  };

  const handleAddDept = () => {
    if (newDeptName.trim()) {
      addDepartment(activeCompanyId, {
        name: newDeptName.trim(),
        description: newDeptDesc.trim(),
      });
      setNewDeptName('');
      setNewDeptDesc('');
      setShowAddDept(false);
    }
  };

  const handleAddEmployee = () => {
    if (newEmpName.trim() && newEmpRole.trim() && newEmpDept.trim()) {
      addEmployee(activeCompanyId, {
        name: newEmpName.trim(),
        role: newEmpRole.trim(),
        department: newEmpDept.trim(),
        personality: newEmpPersonality.trim(),
        specialties: newEmpSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
        memoryInstructions: '',
        reportingTo: newEmpReportingTo.trim() || null,
        interactionRules: [],
      });
      setNewEmpName('');
      setNewEmpRole('');
      setNewEmpDept('');
      setNewEmpPersonality('');
      setNewEmpSpecialties('');
      setNewEmpReportingTo('');
      setShowAddEmployee(false);
    }
  };

  const getEmployeeById = (id: string) => company.structure.employees.find((e) => e.id === id);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Company Structure</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">Company Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My AI Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this company do?"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase">Departments</h3>
              <Button size="sm" variant="outline" onClick={() => setShowAddDept(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {company.structure.departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div>
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-sm text-muted-foreground">{dept.description}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeDepartment(activeCompanyId, dept.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {company.structure.departments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No departments yet. Add one to get started.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase">Employees</h3>
              <Button size="sm" variant="outline" onClick={() => setShowAddEmployee(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {company.structure.employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {emp.role} • {emp.department}
                        {emp.reportingTo && ` • Reports to ${getEmployeeById(emp.reportingTo)?.name || 'Unknown'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeEmployee(activeCompanyId, emp.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {company.structure.employees.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No employees yet. Add some to build your company.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>

      {showAddDept && (
        <Dialog open onOpenChange={() => setShowAddDept(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Department Name</Label>
                <Input
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="What does this department do?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDept(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDept}>Add Department</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showAddEmployee && (
        <Dialog open onOpenChange={() => setShowAddEmployee(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    placeholder="Alice Chen"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value)}
                    placeholder="CTO"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    placeholder="Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reports To</Label>
                  <Input
                    value={newEmpReportingTo}
                    onChange={(e) => setNewEmpReportingTo(e.target.value)}
                    placeholder="Manager ID (optional)"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Personality</Label>
                <Textarea
                  value={newEmpPersonality}
                  onChange={(e) => setNewEmpPersonality(e.target.value)}
                  placeholder="Detail-oriented, analytical, prefers data over opinions"
                />
              </div>
              <div className="space-y-2">
                <Label>Specialties (comma-separated)</Label>
                <Input
                  value={newEmpSpecialties}
                  onChange={(e) => setNewEmpSpecialties(e.target.value)}
                  placeholder="System Design, Team Leadership, Python"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddEmployee(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEmployee}>Add Employee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}