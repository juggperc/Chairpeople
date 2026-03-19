import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuid } from 'uuid';
import type { Company, Employee, Department, InteractionRule, CompanyStructure } from '@/types';

interface CompanyState {
  companies: Company[];
  activeCompanyId: string | null;
  getActiveCompany: () => Company | null;
  createCompany: (name: string, description?: string) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  setActiveCompany: (id: string | null) => void;
  addDepartment: (companyId: string, department: Omit<Department, 'id' | 'companyId'>) => Department;
  removeDepartment: (companyId: string, departmentId: string) => void;
  addEmployee: (companyId: string, employee: Omit<Employee, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Employee;
  updateEmployee: (companyId: string, employeeId: string, updates: Partial<Employee>) => void;
  removeEmployee: (companyId: string, employeeId: string) => void;
  addInteractionRule: (companyId: string, rule: Omit<InteractionRule, 'id'>) => void;
  removeInteractionRule: (companyId: string, ruleId: string) => void;
  getEmployeesByDepartment: (companyId: string, department: string) => Employee[];
  getReportingChain: (companyId: string, employeeId: string) => Employee[];
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    immer((set, get) => ({
      companies: [],
      activeCompanyId: null,

      getActiveCompany: () => {
        const { companies, activeCompanyId } = get();
        return companies.find(c => c.id === activeCompanyId) ?? null;
      },

      createCompany: (name, description = '') => {
        const id = uuid();
        const now = new Date().toISOString();
        const company: Company = {
          id,
          name,
          description,
          structure: { departments: [], employees: [], interactionRules: [] },
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          state.companies.push(company);
          state.activeCompanyId = id;
        });
        return company;
      },

      updateCompany: (id, updates) => {
        set((state) => {
          const company = state.companies.find(c => c.id === id);
          if (company) {
            Object.assign(company, updates, { updatedAt: new Date().toISOString() });
          }
        });
      },

      deleteCompany: (id) => {
        set((state) => {
          state.companies = state.companies.filter(c => c.id !== id);
          if (state.activeCompanyId === id) {
            state.activeCompanyId = state.companies[0]?.id ?? null;
          }
        });
      },

      setActiveCompany: (id) => {
        set((state) => {
          state.activeCompanyId = id;
        });
      },

      addDepartment: (companyId, department) => {
        const id = uuid();
        const newDept: Department = { ...department, id, companyId };
        set((state) => {
          const company = state.companies.find(c => c.id === companyId);
          if (company) {
            company.structure.departments.push(newDept);
            company.updatedAt = new Date().toISOString();
          }
        });
        return newDept;
      },

      removeDepartment: (companyId, departmentId) => {
        set((state) => {
          const company = state.companies.find(c => c.id === companyId);
          if (company) {
            company.structure.departments = company.structure.departments.filter(d => d.id !== departmentId);
            company.updatedAt = new Date().toISOString();
          }
        });
      },

      addEmployee: (companyId, employee) => {
        const id = uuid();
        const now = new Date().toISOString();
        const newEmployee: Employee = {
          ...employee,
          id,
          companyId,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          const company = state.companies.find(c => c.id === companyId);
          if (company) {
            company.structure.employees.push(newEmployee);
            company.updatedAt = now;
          }
        });
        return newEmployee;
      },

      updateEmployee: (companyId, employeeId, updates) => {
        set((state) => {
          const company = state.companies.find(c => c.id === companyId);
          if (company) {
            const employee = company.structure.employees.find(e => e.id === employeeId);
            if (employee) {
              Object.assign(employee, updates, { updatedAt: new Date().toISOString() });
              company.updatedAt = new Date().toISOString();
            }
          }
        });
      },

      removeEmployee: (companyId, employeeId) => {
        set((state) => {
          const company = state.companies.find(c => c.id === companyId);
          if (company) {
            company.structure.employees = company.structure.employees.filter(e => e.id !== employeeId);
            company.structure.interactionRules = company.structure.interactionRules.filter(
              r => r.from !== employeeId && r.to !== employeeId
            );
            company.structure.departments = company.structure.departments.filter(d => d.id !== employeeId);
            company.updatedAt = new Date().toISOString();
          }
        });
      },

      addInteractionRule: (companyId, rule) => {
        const id = uuid();
        set((state) => {
          const company = state.companies.find(c => c.id === companyId);
          if (company) {
            company.structure.interactionRules.push({ ...rule, id });
            company.updatedAt = new Date().toISOString();
          }
        });
      },

      removeInteractionRule: (companyId, ruleId) => {
        set((state) => {
          const company = state.companies.find(c => c.id === companyId);
          if (company) {
            company.structure.interactionRules = company.structure.interactionRules.filter(r => r.id !== ruleId);
            company.updatedAt = new Date().toISOString();
          }
        });
      },

      getEmployeesByDepartment: (companyId, department) => {
        const company = get().companies.find(c => c.id === companyId);
        if (!company) return [];
        return company.structure.employees.filter(e => e.department === department);
      },

      getReportingChain: (companyId, employeeId) => {
        const company = get().companies.find(c => c.id === companyId);
        if (!company) return [];
        const chain: Employee[] = [];
        let current = company.structure.employees.find(e => e.id === employeeId);
        while (current?.reportingTo) {
          const manager = company.structure.employees.find(e => e.id === current!.reportingTo);
          if (manager) {
            chain.push(manager);
            current = manager;
          } else {
            break;
          }
        }
        return chain;
      },
    })),
    {
      name: 'chairpeople-companies',
    }
  )
);