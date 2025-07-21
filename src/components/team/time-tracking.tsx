"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Coffee, 
  Calendar,
  Timer,
  CheckCircle,
  AlertCircle 
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TimeEntry } from "@/types/team"
import { formatDistanceToNow, format, differenceInMinutes } from "date-fns"

interface TimeTrackingProps {
  userId: string
  currentEntry?: TimeEntry
  onClockIn: () => void
  onClockOut: (notes?: string) => void
  onStartBreak: () => void
  onEndBreak: () => void
  className?: string
}

export function TimeTracking({
  userId,
  currentEntry,
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  className,
}: TimeTrackingProps) {
  const [clockOutNotes, setClockOutNotes] = React.useState("")
  const [isClockOutDialogOpen, setIsClockOutDialogOpen] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(new Date())

  // Update current time every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const isOnBreak = currentEntry?.breakStart && !currentEntry?.breakEnd
  const isWorking = currentEntry && !currentEntry.clockOut && !isOnBreak

  const getWorkingTime = () => {
    if (!currentEntry?.clockIn) return "00:00"
    
    const start = new Date(currentEntry.clockIn)
    const end = currentEntry.clockOut ? new Date(currentEntry.clockOut) : currentTime
    
    // Subtract break time if applicable
    let totalMinutes = differenceInMinutes(end, start)
    
    if (currentEntry.breakStart && currentEntry.breakEnd) {
      const breakMinutes = differenceInMinutes(
        new Date(currentEntry.breakEnd),
        new Date(currentEntry.breakStart)
      )
      totalMinutes -= breakMinutes
    } else if (currentEntry.breakStart && !currentEntry.breakEnd) {
      const breakMinutes = differenceInMinutes(
        currentTime,
        new Date(currentEntry.breakStart)
      )
      totalMinutes -= breakMinutes
    }
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const getBreakTime = () => {
    if (!currentEntry?.breakStart) return "00:00"
    
    const start = new Date(currentEntry.breakStart)
    const end = currentEntry.breakEnd ? new Date(currentEntry.breakEnd) : currentTime
    
    const totalMinutes = differenceInMinutes(end, start)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const handleClockOut = () => {
    onClockOut(clockOutNotes)
    setClockOutNotes("")
    setIsClockOutDialogOpen(false)
  }

  const getStatusBadge = () => {
    if (!currentEntry) {
      return <Badge variant="secondary">Clocked Out</Badge>
    }
    
    if (currentEntry.clockOut) {
      return <Badge variant="secondary">Clocked Out</Badge>
    }
    
    if (isOnBreak) {
      return <Badge variant="warning">On Break</Badge>
    }
    
    return <Badge variant="success">Working</Badge>
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Time Display */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold">
            {format(currentTime, "HH:mm:ss")}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(currentTime, "EEEE, MMMM d, yyyy")}
          </div>
        </div>

        {/* Working Time Display */}
        {currentEntry && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="text-2xl font-mono font-bold text-primary">
                {getWorkingTime()}
              </div>
              <div className="text-sm text-muted-foreground">
                Working Time
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-mono font-bold">
                {getBreakTime()}
              </div>
              <div className="text-sm text-muted-foreground">
                Break Time
              </div>
            </div>
          </div>
        )}

        {/* Clock In/Out Times */}
        {currentEntry && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clock In:</span>
              <span className="font-medium">
                {format(new Date(currentEntry.clockIn), "HH:mm")}
              </span>
            </div>
            
            {currentEntry.clockOut && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clock Out:</span>
                <span className="font-medium">
                  {format(new Date(currentEntry.clockOut), "HH:mm")}
                </span>
              </div>
            )}
            
            {currentEntry.breakStart && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Break Started:</span>
                <span className="font-medium">
                  {format(new Date(currentEntry.breakStart), "HH:mm")}
                </span>
              </div>
            )}
            
            {currentEntry.breakEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Break Ended:</span>
                <span className="font-medium">
                  {format(new Date(currentEntry.breakEnd), "HH:mm")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!currentEntry || currentEntry.clockOut ? (
            <Button onClick={onClockIn} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Clock In
            </Button>
          ) : (
            <div className="space-y-2">
              {!isOnBreak ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={onStartBreak}
                    disabled={!isWorking}
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Start Break
                  </Button>
                  
                  <Dialog open={isClockOutDialogOpen} onOpenChange={setIsClockOutDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Square className="h-4 w-4 mr-2" />
                        Clock Out
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Clock Out</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={clockOutNotes}
                            onChange={(e) => setClockOutNotes(e.target.value)}
                            placeholder="Add any notes about your work today..."
                            rows={3}
                          />
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-md">
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span>Total Working Time:</span>
                              <span className="font-medium">{getWorkingTime()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Break Time:</span>
                              <span className="font-medium">{getBreakTime()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsClockOutDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleClockOut}>
                            Clock Out
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={onEndBreak}
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    End Break
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsClockOutDialogOpen(true)}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Clock Out
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Message */}
        {currentEntry && !currentEntry.clockOut && (
          <div className="text-center text-sm text-muted-foreground">
            {isOnBreak ? (
              <div className="flex items-center justify-center gap-2">
                <Coffee className="h-4 w-4" />
                On break since {formatDistanceToNow(new Date(currentEntry.breakStart!), { addSuffix: true })}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Timer className="h-4 w-4" />
                Working since {formatDistanceToNow(new Date(currentEntry.clockIn), { addSuffix: true })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}