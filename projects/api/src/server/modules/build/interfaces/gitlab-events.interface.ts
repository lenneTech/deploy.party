export interface GitLabEvents {
    object_attributes: {
      work_in_progress: string;
      source: {
        path_with_namespace: string;
      };
      isDraft: string;
      action: string;
      source_branch: string;
      target_branch: string;
      iid: string;
    };
    user_avatar: string;
    user_name: string;
    project: {
      id: string;
      web_url: string;
    };
    repository: {
      name: string;
      url: string;
      description: string;
      homepage: string;
      git_http_url: string;
      git_ssh_url: string;
      visibility_level: number;
    };
    commits: {
      id: string;
      title: string;
      message: string;
      timestamp: string;
      url: string;
      added: string[];
      modified: string[];
      removed: string[];
    }[];
    object_kind: string;
    ref: string;
    project_id: string;
}
