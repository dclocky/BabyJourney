import { storage } from "./storage";
import { randomBytes } from "crypto";
import { addDays } from "date-fns";

export interface Permission {
  canViewPhotos: boolean;
  canViewMedical: boolean;
  canViewFeeding: boolean;
  canViewSleep: boolean;
  canViewDiapers: boolean;
  canAddData: boolean;
  canInviteMembers: boolean;
  canManageGroup: boolean;
}

export const DEFAULT_PERMISSIONS: Record<string, Permission> = {
  owner: {
    canViewPhotos: true,
    canViewMedical: true,
    canViewFeeding: true,
    canViewSleep: true,
    canViewDiapers: true,
    canAddData: true,
    canInviteMembers: true,
    canManageGroup: true,
  },
  admin: {
    canViewPhotos: true,
    canViewMedical: true,
    canViewFeeding: true,
    canViewSleep: true,
    canViewDiapers: true,
    canAddData: true,
    canInviteMembers: true,
    canManageGroup: false,
  },
  contributor: {
    canViewPhotos: true,
    canViewMedical: false,
    canViewFeeding: true,
    canViewSleep: true,
    canViewDiapers: true,
    canAddData: true,
    canInviteMembers: false,
    canManageGroup: false,
  },
  viewer: {
    canViewPhotos: true,
    canViewMedical: false,
    canViewFeeding: true,
    canViewSleep: true,
    canViewDiapers: false,
    canAddData: false,
    canInviteMembers: false,
    canManageGroup: false,
  },
};

export class FamilyGroupService {
  // Create a new family group
  async createGroup(childId: number, userId: number, name: string, description?: string) {
    try {
      // Generate unique invite code
      const inviteCode = randomBytes(16).toString('hex');
      
      // Create the group
      const group = await storage.createFamilyGroup({
        childId,
        name,
        description,
        inviteCode,
        isActive: true,
      });

      // Add the creator as owner
      await storage.createGroupMember({
        groupId: group.id,
        userId,
        role: 'owner',
        permissions: DEFAULT_PERMISSIONS.owner,
        invitedBy: userId,
      });

      // Log the action
      await this.logAudit(group.id, userId, 'group_created', 'family_group', group.id, {}, { name, description });

      return group;
    } catch (error) {
      console.error('Error creating family group:', error);
      throw new Error('Failed to create family group');
    }
  }

  // Send invitation to join group
  async inviteMember(groupId: number, invitedBy: number, email: string, role: string, customPermissions?: Partial<Permission>) {
    try {
      // Check if inviter has permission
      const inviterMember = await storage.getGroupMember(groupId, invitedBy);
      if (!inviterMember?.permissions?.canInviteMembers) {
        throw new Error('No permission to invite members');
      }

      // Generate secure token
      const token = randomBytes(64).toString('hex');
      const expiresAt = addDays(new Date(), 7); // 7 days expiration

      // Get role permissions and merge with custom ones
      const permissions = {
        ...DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS],
        ...customPermissions,
      };

      // Create invitation
      const invitation = await storage.createGroupInvitation({
        groupId,
        email,
        token,
        role,
        permissions,
        invitedBy,
        expiresAt,
      });

      // Log the action
      await this.logAudit(groupId, invitedBy, 'member_invited', 'invitation', invitation.id, {}, { email, role });

      // In a real app, you would send an email here
      // await this.sendInvitationEmail(email, token, groupName);

      return invitation;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw new Error('Failed to send invitation');
    }
  }

  // Accept invitation and join group
  async acceptInvitation(token: string, userId: number) {
    try {
      // Find valid invitation
      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        throw new Error('Invalid invitation token');
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        throw new Error('Invitation has expired');
      }

      if (invitation.acceptedAt) {
        throw new Error('Invitation already accepted');
      }

      // Check if user is already a member
      const existingMember = await storage.getGroupMember(invitation.groupId, userId);
      if (existingMember) {
        throw new Error('Already a member of this group');
      }

      // Add user to group
      const member = await storage.createGroupMember({
        groupId: invitation.groupId,
        userId,
        role: invitation.role,
        permissions: invitation.permissions,
        invitedBy: invitation.invitedBy,
      });

      // Mark invitation as accepted
      await storage.updateInvitation(invitation.id, { acceptedAt: new Date() });

      // Log the action
      await this.logAudit(invitation.groupId, userId, 'invitation_accepted', 'group_member', member.id, {}, { role: invitation.role });

      return member;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Check if user has specific permission in group
  async hasPermission(groupId: number, userId: number, permission: keyof Permission): Promise<boolean> {
    try {
      const member = await storage.getGroupMember(groupId, userId);
      if (!member) return false;
      
      return member.permissions?.[permission] || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Get user's role in group
  async getUserRole(groupId: number, userId: number): Promise<string | null> {
    try {
      const member = await storage.getGroupMember(groupId, userId);
      return member?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Update member permissions
  async updateMemberPermissions(groupId: number, targetUserId: number, updatedBy: number, newPermissions: Permission) {
    try {
      // Check if updater has manage permission
      const updaterMember = await storage.getGroupMember(groupId, updatedBy);
      if (!updaterMember?.permissions?.canManageGroup) {
        throw new Error('No permission to manage group members');
      }

      // Get current member
      const currentMember = await storage.getGroupMember(groupId, targetUserId);
      if (!currentMember) {
        throw new Error('Member not found');
      }

      // Update permissions
      await storage.updateGroupMember(currentMember.id, { permissions: newPermissions });

      // Log the action
      await this.logAudit(groupId, updatedBy, 'permissions_updated', 'group_member', currentMember.id, 
        { permissions: currentMember.permissions }, { permissions: newPermissions });

      return true;
    } catch (error) {
      console.error('Error updating member permissions:', error);
      throw error;
    }
  }

  // Remove member from group
  async removeMember(groupId: number, targetUserId: number, removedBy: number) {
    try {
      // Check permissions
      const removerMember = await storage.getGroupMember(groupId, removedBy);
      const targetMember = await storage.getGroupMember(groupId, targetUserId);

      if (!removerMember?.permissions?.canManageGroup) {
        throw new Error('No permission to remove members');
      }

      if (!targetMember) {
        throw new Error('Member not found');
      }

      // Can't remove owner
      if (targetMember.role === 'owner') {
        throw new Error('Cannot remove group owner');
      }

      // Remove member
      await storage.removeGroupMember(targetMember.id);

      // Log the action
      await this.logAudit(groupId, removedBy, 'member_removed', 'group_member', targetMember.id, 
        { userId: targetUserId, role: targetMember.role }, {});

      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  // Create activity in group feed
  async createActivity(groupId: number, userId: number, activityType: string, title: string, description?: string, metadata?: any) {
    try {
      // Check if user is member
      const member = await storage.getGroupMember(groupId, userId);
      if (!member) {
        throw new Error('Not a member of this group');
      }

      const activity = await storage.createGroupActivity({
        groupId,
        userId,
        activityType,
        title,
        description,
        metadata,
        isVisible: true,
      });

      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  // Add comment to activity
  async addComment(activityId: number, userId: number, content: string) {
    try {
      // Get activity and check group membership
      const activity = await storage.getGroupActivity(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      const member = await storage.getGroupMember(activity.groupId, userId);
      if (!member) {
        throw new Error('Not a member of this group');
      }

      const comment = await storage.createActivityComment({
        activityId,
        userId,
        content,
      });

      // Log the action
      await this.logAudit(activity.groupId, userId, 'comment_added', 'activity_comment', comment.id, {}, { content });

      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Add like/reaction to activity
  async addReaction(activityId: number, userId: number, reactionType: string = 'like') {
    try {
      // Get activity and check group membership
      const activity = await storage.getGroupActivity(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      const member = await storage.getGroupMember(activity.groupId, userId);
      if (!member) {
        throw new Error('Not a member of this group');
      }

      // Check if already reacted
      const existingReaction = await storage.getActivityLike(activityId, userId);
      if (existingReaction) {
        // Update reaction type
        await storage.updateActivityLike(existingReaction.id, { reactionType });
        return existingReaction;
      }

      const reaction = await storage.createActivityLike({
        activityId,
        userId,
        reactionType,
      });

      return reaction;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Private method to log audit events
  private async logAudit(groupId: number, userId: number, action: string, resourceType?: string, resourceId?: number, oldValues?: any, newValues?: any, req?: any) {
    try {
      await storage.createAuditLog({
        groupId,
        userId,
        action,
        resourceType,
        resourceId,
        oldValues,
        newValues,
        ipAddress: req?.ip || 'unknown',
        userAgent: req?.get('User-Agent') || 'unknown',
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw - audit logging should not break main functionality
    }
  }

  // Get group activities with pagination
  async getGroupActivities(groupId: number, userId: number, limit: number = 20, offset: number = 0) {
    try {
      // Check if user is member
      const member = await storage.getGroupMember(groupId, userId);
      if (!member) {
        throw new Error('Not a member of this group');
      }

      const activities = await storage.getGroupActivities(groupId, limit, offset);
      return activities;
    } catch (error) {
      console.error('Error getting group activities:', error);
      throw error;
    }
  }

  // Get group members
  async getGroupMembers(groupId: number, userId: number) {
    try {
      // Check if user is member
      const member = await storage.getGroupMember(groupId, userId);
      if (!member) {
        throw new Error('Not a member of this group');
      }

      const members = await storage.getGroupMembers(groupId);
      return members;
    } catch (error) {
      console.error('Error getting group members:', error);
      throw error;
    }
  }
}

export const familyGroupService = new FamilyGroupService();