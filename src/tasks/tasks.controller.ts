/** MBOUOPDA NDEFFO CORNELIUS JUGAL - 5IW3 */
import { Controller } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CreateTaskRequest, Task, GetTaskRequest, ListTasksResponse, UpdateTaskRequest, DeleteTaskRequest, ListTasksRequest } from 'stubs/task/v1alpha/task';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { fromTaskToGrpc } from './global.functions';
import { status } from '@grpc/grpc-js';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @GrpcMethod('TaskService')
  async CreateTask(request: CreateTaskRequest): Promise<Task> {
    try{
      const task = await this.tasksService.create(
        new CreateTaskDto(request.task),
      );
      return fromTaskToGrpc(task) as any;
    }catch(err){
      if (err.code === 'P2009') {
        throw new RpcException({ message: request.task.name + ' is already taken', code: status.INVALID_ARGUMENT });
      }
      if (err.code === 'P2002') {
        throw new RpcException({ message: 'Task with same Name already exists', code: status.ALREADY_EXISTS });
      }
      if(err instanceof RpcException){
        throw err;
      }
      throw new RpcException(err);
    }
  }

  @GrpcMethod('TaskService')
  async ListTasks(request: ListTasksRequest): Promise<ListTasksResponse> {
    try{
      let { pageSize, pageToken } = request;
      pageToken = Number.isNaN(parseInt(request.pageToken)) === true || parseInt(request.pageToken) === 0 ? "1" : (parseInt(request.pageToken)).toString();
      const tasks = await this.tasksService.findAll(pageToken, pageSize);
      return ListTasksResponse.create({ task: tasks.map(fromTaskToGrpc), nextPageToken:  (parseInt(pageToken) +1).toString() });
    }catch(err){
      if(err instanceof RpcException){
        throw err;
      }
      throw new RpcException(err);
    }
  }

  @GrpcMethod('TaskService')
  async GetTask(request: GetTaskRequest): Promise<Task> {
    try{
      if(request.name == "" || request.name == null){
        throw new RpcException({ message: 'Invalid Entry Data', code: 3 });
      }
      const task = await this.tasksService.findByName(request.name);
      if (!task) {
        throw new RpcException({ message: 'task' + request.name + 'not found', code: status.NOT_FOUND });
      }
      return fromTaskToGrpc(task) as any;
    }catch(err){
      if(err instanceof RpcException){
        throw err;
      }
      throw new RpcException(err.error);
    }
  }

  @GrpcMethod('TaskService')
  async UpdateTask(request: UpdateTaskRequest): Promise<Task> {
    try{
      let task = await this.tasksService.findOne(request.task.id);
      if (!task) {
        throw new RpcException({ message: 'Task not found', code: 5 });
      }
      task = await this.tasksService.update(request.task.id, new UpdateTaskDto(request.task));
      return fromTaskToGrpc(task) as any;
    }catch(err){
      if (err.code === 'P2009') {
        throw new RpcException({ message: request.task.name + ' is already taken', code: status.INVALID_ARGUMENT });
      }
      if (err.code === 'P2002') {
        throw new RpcException({ message: 'Task with same Name already exists', code: status.ALREADY_EXISTS });
      }
      if(err instanceof RpcException){
        throw err;
      }
      throw new RpcException(err);
    }
  }

  @GrpcMethod('TaskService')
  async DeleteTask(request: DeleteTaskRequest): Promise<Task> {
    try{
      const task = await this.tasksService.findByName(request.name);
      if(!task){
        throw new RpcException({ message: 'task' + request.name + 'not found', code: status.NOT_FOUND });
      }
      await this.tasksService.remove(task.id);
      return fromTaskToGrpc(task) as any;
    }catch(err){
      if(err instanceof RpcException){
        throw err;
      }
      throw new RpcException(err);
    }
  }
}