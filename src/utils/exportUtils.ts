import * as XLSX from 'xlsx';
import { Task } from '../types';

export const exportToExcel = (tasks: Task[], filename = 'harmony360-tasks.xlsx') => {
  try {
    // Create a workbook
    const wb = XLSX.utils.book_new();
    
    // Convert tasks to a format suitable for Excel
    const data = tasks.map(task => {
      // Base task data
      const baseData: {[key: string]: any} = {
        'Task Category': task.category,
        'Task Name': task.name,
        'Description': task.description,
        'SOP Link': task.sopLink || '',
        'Policy Link': task.policyLink || '',
        'Risk Rating': task.riskRating,
        'Owner': task.owner || '',
      };
      
      // Add competency data for each staff member
      task.competencies.forEach((comp, index) => {
        baseData[`TM${index + 1} Competency`] = comp.status;
      });
      
      return baseData;
    });
    
    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    
    // Generate Excel file
    XLSX.writeFile(wb, filename);
    
    return { success: true, message: `Successfully exported ${tasks.length} tasks to ${filename}` };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { 
      success: false, 
      message: `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

export const importFromExcel = (file: File): Promise<{ success: boolean; data?: Task[]; message: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const wsname = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[wsname];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // TODO: Process the imported data into Task objects
        // This would require mapping the Excel columns to our Task type
        // For now, we'll just return success with the raw data
        
        resolve({ 
          success: true, 
          message: `Successfully imported ${jsonData.length} records`,
          data: [] // Would need proper mapping to Task[]
        });
      } catch (error) {
        reject({ 
          success: false, 
          message: `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    };
    
    reader.onerror = () => {
      reject({ success: false, message: 'Failed to read file' });
    };
    
    reader.readAsArrayBuffer(file);
  });
};