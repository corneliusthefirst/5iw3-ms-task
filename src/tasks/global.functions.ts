export const fromTaskToGrpc = (task: {
    id: number;
    name: string;
    dueDate: Date;
    done: boolean;
    }) => ({
        ...task,
        dueDate: task.dueDate.toISOString(),
    });