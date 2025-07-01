import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from '../components/ui/Table';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { sampleStaff } from '../data/sampleData';

export const Staff: React.FC = () => {
  const { userProfile } = useAuth();
  const { canAddStaff } = useSubscription();
  const [canCreateStaff, setCanCreateStaff] = useState(true);

  useEffect(() => {
    const checkStaffLimit = async () => {
      if (userProfile?.role !== 'super_admin') {
        const canAdd = await canAddStaff();
        setCanCreateStaff(canAdd);
      }
    };

    if (userProfile) {
      checkStaffLimit();
    }
  }, []); // Empty dependency - run only once on mount when userProfile is available

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Staff Management</h1>
        <div className="flex flex-col items-end space-y-2">
          {!canCreateStaff && userProfile?.role !== 'super_admin' && (
            <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Staff limit reached
            </div>
          )}
          <Button 
            leftIcon={<Plus className="h-4 w-4" />}
            disabled={!canCreateStaff && userProfile?.role !== 'super_admin'}
            className={!canCreateStaff && userProfile?.role !== 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Add Staff Member
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Department</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleStaff.map(staff => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>{staff.role}</TableCell>
                  <TableCell>{staff.department}</TableCell>
                  <TableCell>{staff.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};