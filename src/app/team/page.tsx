"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TimeTracking } from "@/components/team/time-tracking"
import { useNotifications } from "@/hooks/use-notifications"
import { usePermissions, ProtectedComponent, PERMISSIONS } from "@/hooks/use-permissions"
import { 
  Clock, 
  Users, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format, startOfWeek, endOfWeek, differenceInHours } from "date-fns"

// Mock data - in a real app, this would come from your database
const mockTimeEntries = [
  {
    id: "1",
    userId: "user1",
    userName: "John Doe",
    clockIn: new Date(2024, 0, 15, 9, 0),
    clockOut: new Date(2024, 0, 15, 17, 30),
    breakStart: new Date(2024, 0, 15, 12, 0),
    breakEnd: new Date(2024, 0, 15, 13, 0),
    notes: "Regular shift",
    status: "completed" as const
  },
  {
    id: "2", 
    userId: "user2",
    userName: "Jane Smith",
    clockIn: new Date(2024, 0, 15, 8, 30),
    clockOut: null,
    breakStart: null,
    breakEnd: null,
    notes: "",
    status: "active" as const
  },
  {
    id: "3",
    userId: "user3", 
    userName: "Mike Johnson",
    clockIn: new Date(2024, 0, 15, 10, 0),
    clockOut: new Date(2024, 0, 15, 18, 0),
    breakStart: new Date(2024, 0, 15, 14, 0),
    breakEnd: new Date(2024, 0, 15, 14, 30),
    notes: "Overtime approved",
    status: "completed" as const
  }
]

const mockCurrentUser = {
  id: "current-user",
  name: "Current User",
  email: "user@example.com",
  role: {
    id: "staff",
    name: "staff",
    permissions: [
      { id: "1", resource: "time", action: "create" },
      { id: "2", resource: "time", action: "read" }
    ]
  },
  permissions: []
}

export default function TeamPage() {
  const { addNotification } = useNotifications()
  const [currentEntry, setCurrentEntry] = React.useState<any>(null)

  const handleClockIn = () => {
    addNotification({
      title: "Clocked In",
      message: "You have successfully clocked in for today",
      type: "success",
    })
  }

  const handleClockOut = (notes?: string) => {
    addNotification({
      title: "Clocked Out", 
      message: notes ? `Clocked out with notes: ${notes}` : "You have clocked out for today",
      type: "info",
    })
  }

  const handleStartBreak = () => {
    addNotification({
      title: "Break Started",
      message: "Enjoy your break!",
      type: "info",
    })
  }

  const handleEndBreak = () => {
    addNotification({
      title: "Break Ended",
      message: "Welcome back! Ready to continue working?",
      type: "success",
    })
  }

  const calculateHours = (entry: typeof mockTimeEntries[0]) => {
    if (!entry.clockOut) return 0
    const totalMinutes = differenceInHours(entry.clockOut, entry.clockIn)
    const breakMinutes = entry.breakStart && entry.breakEnd 
      ? differenceInHours(entry.breakEnd, entry.breakStart)
      : 0
    return totalMinutes - breakMinutes
  }

  const todayEntries = mockTimeEntries.filter(entry => 
    format(entry.clockIn, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  )

  const activeEntries = mockTimeEntries.filter(entry => entry.status === 'active')

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Track time, manage schedules, and monitor team productivity
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {activeEntries.length} Active
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {todayEntries.length} Today
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold">{activeEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hours Today</p>
                <p className="text-2xl font-bold">
                  {todayEntries.reduce((sum, entry) => sum + calculateHours(entry), 0).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">127.5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                <p className="text-2xl font-bold">8.2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Time Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeTracking
            userId="current-user"
            currentEntry={currentEntry}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            onStartBreak={handleStartBreak}
            onEndBreak={handleEndBreak}
          />
        </CardContent>
      </Card>

      {/* Team Overview - Only for managers/admins */}
      <ProtectedComponent 
        requiredPermissions={[PERMISSIONS.USERS_VIEW]}
        fallback={
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                You need manager permissions to view team time tracking data.
              </p>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTimeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.userName}</TableCell>
                    <TableCell>{format(entry.clockIn, 'HH:mm')}</TableCell>
                    <TableCell>
                      {entry.clockOut ? format(entry.clockOut, 'HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      {entry.breakStart && entry.breakEnd 
                        ? `${format(entry.breakStart, 'HH:mm')} - ${format(entry.breakEnd, 'HH:mm')}`
                        : entry.breakStart 
                        ? `Started ${format(entry.breakStart, 'HH:mm')}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{calculateHours(entry).toFixed(1)}h</TableCell>
                    <TableCell>
                      <Badge 
                        variant={entry.status === 'active' ? 'default' : 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {entry.status === 'active' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {entry.status === 'active' ? 'Active' : 'Completed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </ProtectedComponent>
    </div>
  )
}
