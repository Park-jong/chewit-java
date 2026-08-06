export interface Task {
  id: number
  title: string
  memo: string | null
  date: string
  done: boolean
  createdAt: string
}

export interface CreateTaskRequest {
  title: string
  memo?: string
  date: string
}

export interface UpdateTaskRequest {
  title: string
  memo?: string
  date: string
}
